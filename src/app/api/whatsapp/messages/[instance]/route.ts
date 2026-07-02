import { NextRequest, NextResponse } from 'next/server';
import { EvolutionClient } from '@/lib/evolution-client';
import { normalizeEvolutionMessages } from '@/lib/whatsapp-normalizers';
import { supabaseAdmin } from '@/lib/supabase';
import { toWhatsAppMessage, upsertMessages, type WhatsAppMessageRow } from '@/lib/whatsapp-message-store';

async function queryLocal(
  instance: string,
  remoteJid: string,
  pageSize: number,
  cursor?: string,
) {
  let query = supabaseAdmin
    .from('whatsapp_messages')
    .select('*')
    .eq('instance_name', instance)
    .eq('remote_jid', remoteJid)
    .order('message_timestamp', { ascending: false })
    .limit(pageSize + 1);

  if (cursor) {
    query = query.lt('message_timestamp', cursor);
  }

  return query;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ instance: string }> }
) {
  try {
    const { instance } = await params;
    const body = await req.json();
    const { remoteJid, limit = 50, before, after } = body as {
      remoteJid: string;
      limit?: number;
      before?: string;
      after?: string;
    };

    if (!remoteJid) {
      return NextResponse.json({ error: 'remoteJid é obrigatório' }, { status: 400 });
    }

    const pageSize = Math.min(Number(limit) || 50, 100);

    // Incremental sync: fetch only messages newer than `after`
    if (after) {
      const afterDate = new Date(after);
      const evolutionResponse = await EvolutionClient.findMessages(instance, remoteJid, pageSize);
      const normalized = normalizeEvolutionMessages(evolutionResponse, remoteJid);
      const newMessages = normalized.filter(
        m => new Date(m.messageTimestamp * 1000) > afterDate,
      );

      await upsertMessages(newMessages, instance);

      return NextResponse.json({ messages: newMessages, nextCursor: null, hasMore: false });
    }

    // Paginated read: query Supabase first
    const { data: rows, error } = await queryLocal(instance, remoteJid, pageSize, before);

    if (error) throw error;

    // Seed from Evolution API on first load (no local data, no cursor)
    if ((!rows || rows.length === 0) && !before) {
      const evolutionResponse = await EvolutionClient.findMessages(instance, remoteJid, pageSize);
      const normalized = normalizeEvolutionMessages(evolutionResponse, remoteJid);

      await upsertMessages(normalized, instance);

      const { data: seeded, error: seededError } = await queryLocal(instance, remoteJid, pageSize);
      if (seededError) throw seededError;

      const page = (seeded ?? []).slice(0, pageSize) as WhatsAppMessageRow[];
      const hasMore = (seeded?.length ?? 0) > pageSize;

      return NextResponse.json({
        messages: page.map(toWhatsAppMessage).reverse(),
        nextCursor: hasMore ? page[page.length - 1].message_timestamp : null,
        hasMore,
      });
    }

    const page = (rows ?? []).slice(0, pageSize) as WhatsAppMessageRow[];
    const hasMore = rows.length > pageSize;

    return NextResponse.json({
      messages: page.map(toWhatsAppMessage).reverse(),
      nextCursor: hasMore ? page[page.length - 1].message_timestamp : null,
      hasMore,
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json({ error: 'Falha ao buscar mensagens' }, { status: 500 });
  }
}
