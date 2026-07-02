import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EvolutionClient } from '@/lib/evolution-client';
import { getNextWhatsAppInstance } from '@/lib/round-robin';

export async function POST(req: NextRequest) {
  try {
    const { lead_id, message, phone } = await req.json();

    if (!lead_id || !message || !phone) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Selecionar instância via Rodízio
    const instance = await getNextWhatsAppInstance();

    if (!instance) {
      return NextResponse.json({ 
        error: 'Nenhuma instância de WhatsApp disponível ou limite atingido.',
        fallback: true // Indica que o frontend deve usar o fallback (link wa.me)
      }, { status: 404 });
    }

    // 2. Disparar via Evolution — falha aqui grava log 'failed' e retorna 500
    const cleanPhone = phone.replace(/\D/g, '');
    const remoteJid = `${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}@s.whatsapp.net`;

    let evolutionRes: Awaited<ReturnType<typeof EvolutionClient.sendMessage>>;
    try {
      evolutionRes = await EvolutionClient.sendMessage(instance.instance_name, phone, message);
    } catch (sendError) {
      const errMsg = sendError instanceof Error ? sendError.message : 'Unknown Evolution error';
      console.error(`[send] Evolution API error on ${instance.instance_name}:`, errMsg);
      await supabaseAdmin.from('message_logs').insert({
        lead_id,
        instance_id: instance.id,
        channel: 'whatsapp',
        phone,
        message,
        status: 'failed',
      }).then(
        ({ error: logErr }) => { if (logErr) console.error('[send] Failed to write error log:', logErr.message); },
      );
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // 3. Registrar Log, atualizar lead e persistir histórico raw
    // (last_used_at já foi atualizado atomicamente pelo round-robin)
    const evolutionMessageId: string | undefined =
      evolutionRes?.key?.id ?? evolutionRes?.message?.key?.id;

    await Promise.all([
      supabaseAdmin.from('message_logs').insert({
        lead_id,
        instance_id: instance.id,
        channel: 'whatsapp',
        phone,
        message,
        evolution_message_id: evolutionMessageId,
        status: 'sent',
      }),
      supabaseAdmin.from('leads').update({
        status: 'contatado',
      }).eq('id', lead_id),
      ...(evolutionMessageId
        ? [supabaseAdmin.from('whatsapp_messages').upsert(
            {
              instance_name: instance.instance_name,
              remote_jid: evolutionRes?.key?.remoteJid ?? remoteJid,
              message_id: evolutionMessageId,
              from_me: true,
              message_text: message,
              message_type: 'conversation',
              message_timestamp: new Date().toISOString(),
              status: evolutionRes?.status ?? 'PENDING',
              raw_payload: evolutionRes?.message ?? { conversation: message },
            },
            { onConflict: 'instance_name,remote_jid,message_id', ignoreDuplicates: true },
          )]
        : []),
    ]);

    return NextResponse.json({ ok: true, instance: instance.display_name });

  } catch (error) {
    console.error('Erro no envio via Evolution:', error);
    const message = error instanceof Error ? error.message : 'Falha no envio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
