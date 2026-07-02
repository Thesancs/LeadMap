import { NextRequest, NextResponse } from 'next/server';
import { EvolutionClient } from '@/lib/evolution-client';
import { supabaseAdmin } from '@/lib/supabase';
import type { WhatsAppInstance } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ instance: string }> }
) {
  try {
    const { instance } = await params;
    const { number, text, remoteJid, leadId } = await req.json() as {
      number: string;
      text: string;
      remoteJid?: string;
      leadId?: string;
    };

    if (!number || !text) {
      return NextResponse.json({ error: 'Numero e texto sao obrigatorios' }, { status: 400 });
    }

    const { data: whatsappInstance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, instance_name, display_name, status, daily_limit')
      .eq('instance_name', instance)
      .single();

    if (instanceError) throw instanceError;

    let liveStatus = whatsappInstance.status as WhatsAppInstance['status'];

    try {
      const live = await EvolutionClient.getInstanceStatus(instance);
      liveStatus = live.instance.state;

      if (liveStatus !== whatsappInstance.status) {
        await supabaseAdmin
          .from('whatsapp_instances')
          .update({ status: liveStatus })
          .eq('id', whatsappInstance.id);
      }
    } catch (statusError) {
      console.warn(`[send] Falha ao consultar status live de ${instance}:`, statusError);
    }

    if (liveStatus !== 'open') {
      return NextResponse.json({ error: 'Instancia indisponivel para envio' }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: sentToday, error: countError } = await supabaseAdmin
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('instance_id', whatsappInstance.id)
      .eq('channel', 'whatsapp')
      .eq('status', 'sent')
      .gte('created_at', todayStart.toISOString());

    if (countError) throw countError;

    if ((sentToday ?? 0) >= whatsappInstance.daily_limit) {
      return NextResponse.json({ error: 'Limite diario dessa instancia foi atingido' }, { status: 429 });
    }

    let response: Awaited<ReturnType<typeof EvolutionClient.sendMessage>>;
    try {
      response = await EvolutionClient.sendMessage(instance, number, text);
    } catch (sendError) {
      await supabaseAdmin.from('message_logs').insert({
        lead_id: leadId ?? null,
        instance_id: whatsappInstance.id,
        channel: 'whatsapp',
        phone: number,
        message: text,
        status: 'failed',
      });
      throw sendError;
    }

    const jid: string =
      response?.key?.remoteJid ??
      remoteJid ??
      `${number.replace(/\D/g, '')}@s.whatsapp.net`;
    const messageId: string | undefined = response?.key?.id;

    if (messageId) {
      await supabaseAdmin.from('whatsapp_messages').upsert(
        {
          instance_name: instance,
          remote_jid: jid,
          message_id: messageId,
          from_me: true,
          message_text: text,
          message_type: 'conversation',
          message_timestamp: new Date().toISOString(),
          status: response?.status ?? 'PENDING',
          raw_payload: response?.message ?? { conversation: text },
          lead_id: leadId ?? null,
        },
        { onConflict: 'instance_name,remote_jid,message_id', ignoreDuplicates: true },
      );
    }

    await Promise.all([
      supabaseAdmin.from('message_logs').insert({
        lead_id: leadId ?? null,
        instance_id: whatsappInstance.id,
        channel: 'whatsapp',
        phone: number,
        message: text,
        evolution_message_id: messageId,
        status: 'sent',
      }),
      ...(leadId
        ? [supabaseAdmin.from('leads').update({
            status: 'contatado',
            whatsapp_jid: jid,
          }).eq('id', leadId)]
        : []),
    ]);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    const message = error instanceof Error ? error.message : 'Falha ao enviar mensagem';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
