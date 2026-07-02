import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getLinkedLead } from '@/lib/whatsapp-message-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const remoteJid = searchParams.get('remoteJid');
    const instanceName = searchParams.get('instanceName') ?? undefined;

    if (!remoteJid) {
      return NextResponse.json({ error: 'remoteJid é obrigatório' }, { status: 400 });
    }

    const lead = await getLinkedLead(remoteJid, instanceName);
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao buscar vínculo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { remoteJid, leadId, instanceName } = await req.json() as {
      remoteJid?: string;
      leadId?: string;
      instanceName?: string;
    };

    if (!remoteJid || !leadId) {
      return NextResponse.json({ error: 'remoteJid e leadId são obrigatórios' }, { status: 400 });
    }

    let updateQuery = supabaseAdmin
      .from('whatsapp_messages')
      .update({ lead_id: leadId })
      .eq('remote_jid', remoteJid);

    if (instanceName) {
      updateQuery = updateQuery.eq('instance_name', instanceName);
    }

    const [{ error: messagesError }, { data: lead, error: leadError }] = await Promise.all([
      updateQuery,
      supabaseAdmin
        .from('leads')
        .update({ whatsapp_jid: remoteJid })
        .eq('id', leadId)
        .select('id,nome,status')
        .single(),
    ]);

    if (messagesError) throw messagesError;
    if (leadError) throw leadError;

    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao salvar vínculo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
