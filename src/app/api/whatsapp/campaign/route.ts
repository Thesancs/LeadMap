import { NextRequest, NextResponse } from 'next/server';
import { EvolutionClient } from '@/lib/evolution-client';
import { getNextWhatsAppInstance } from '@/lib/round-robin';
import { checkRateLimit } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase';

type CampaignLead = {
  id: string;
  nome: string;
  telefone: string | null;
  [key: string]: unknown;
};

type CampaignResult = {
  lead_id: string;
  lead_name?: string;
  status: 'sent' | 'failed' | 'skipped';
  instance?: string;
  error?: string;
};

function renderMessage(template: string, lead: Record<string, unknown>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(lead[key] ?? ''));
}

function remoteJidFromPhone(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const normalized = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `${normalized}@s.whatsapp.net`;
}

function summarize(results: CampaignResult[]) {
  return {
    ok: true,
    total: results.length,
    sent: results.filter(result => result.status === 'sent').length,
    failed: results.filter(result => result.status === 'failed').length,
    skipped: results.filter(result => result.status === 'skipped').length,
    results,
  };
}

async function sendCampaignLead(lead: CampaignLead, message: string): Promise<CampaignResult> {
  const phone = String(lead.telefone ?? '');
  const renderedMessage = renderMessage(message, lead);

  if (!phone) {
    return { lead_id: lead.id, lead_name: lead.nome, status: 'skipped', error: 'Lead sem telefone' };
  }

  const instance = await getNextWhatsAppInstance();
  if (!instance) {
    return { lead_id: lead.id, lead_name: lead.nome, status: 'failed', error: 'Nenhuma instancia disponivel' };
  }

  try {
    const evolutionRes = await EvolutionClient.sendMessage(instance.instance_name, phone, renderedMessage);
    const evolutionMessageId: string | undefined =
      evolutionRes?.key?.id ?? evolutionRes?.message?.key?.id;

    await Promise.all([
      supabaseAdmin.from('message_logs').insert({
        lead_id: lead.id,
        instance_id: instance.id,
        channel: 'whatsapp',
        phone,
        message: renderedMessage,
        evolution_message_id: evolutionMessageId,
        status: 'sent',
      }),
      supabaseAdmin.from('leads').update({ status: 'contatado' }).eq('id', lead.id),
      ...(evolutionMessageId
        ? [supabaseAdmin.from('whatsapp_messages').upsert(
            {
              instance_name: instance.instance_name,
              remote_jid: evolutionRes?.key?.remoteJid ?? remoteJidFromPhone(phone),
              message_id: evolutionMessageId,
              from_me: true,
              message_text: renderedMessage,
              message_type: 'conversation',
              message_timestamp: new Date().toISOString(),
              status: evolutionRes?.status ?? 'PENDING',
              raw_payload: evolutionRes?.message ?? { conversation: renderedMessage },
              lead_id: lead.id,
            },
            { onConflict: 'instance_name,remote_jid,message_id', ignoreDuplicates: true },
          )]
        : []),
    ]);

    return {
      lead_id: lead.id,
      lead_name: lead.nome,
      status: 'sent',
      instance: instance.display_name,
    };
  } catch (sendError) {
    const errorMessage = sendError instanceof Error ? sendError.message : 'Falha no envio';
    await supabaseAdmin.from('message_logs').insert({
      lead_id: lead.id,
      instance_id: instance.id,
      channel: 'whatsapp',
      phone,
      message: renderedMessage,
      status: 'failed',
    });
    return { lead_id: lead.id, lead_name: lead.nome, status: 'failed', error: errorMessage };
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, 'whatsapp-campaign', 5, 60_000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Muitas campanhas em sequencia. Tente novamente em instantes.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      );
    }

    const { lead_ids, message } = await req.json() as {
      lead_ids?: string[];
      message?: string;
    };

    if (!Array.isArray(lead_ids) || lead_ids.length === 0 || !message?.trim()) {
      return NextResponse.json({ error: 'lead_ids[] e message sao obrigatorios' }, { status: 400 });
    }

    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .in('id', lead_ids);

    if (leadsError) throw leadsError;

    const campaignLeads = (leads ?? []) as CampaignLead[];

    if (req.headers.get('accept')?.includes('application/x-ndjson')) {
      const encoder = new TextEncoder();

      return new Response(new ReadableStream({
        async start(controller) {
          const results: CampaignResult[] = [];
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'start', total: campaignLeads.length }) + '\n'));

          for (const lead of campaignLeads) {
            const result = await sendCampaignLead(lead, message);
            results.push(result);
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'progress',
              processed: results.length,
              ...summarize(results),
              result,
            }) + '\n'));
          }

          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done', ...summarize(results) }) + '\n'));
          controller.close();
        },
      }), {
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const results: CampaignResult[] = [];
    for (const lead of campaignLeads) {
      results.push(await sendCampaignLead(lead, message));
    }

    return NextResponse.json(summarize(results));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao enviar campanha';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
