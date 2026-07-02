import { supabaseAdmin } from '@/lib/supabase';
import type { Lead, WhatsAppMessage } from '@/types';

export type WhatsAppMessageRow = {
  id: string;
  instance_name: string;
  remote_jid: string;
  message_id: string;
  from_me: boolean;
  message_text: string | null;
  message_type: string | null;
  message_timestamp: string;
  status: string | null;
  raw_payload: WhatsAppMessage['message'] | null;
  lead_id?: string | null;
  created_at: string;
  leads?: Pick<Lead, 'id' | 'nome' | 'status'> | null;
};

export function getMessageText(message: WhatsAppMessage['message']) {
  return (
    message?.conversation ??
    message?.extendedTextMessage?.text ??
    message?.imageMessage?.caption ??
    message?.videoMessage?.caption ??
    message?.documentMessage?.caption ??
    null
  );
}

export function toSupabaseMessageRow(msg: WhatsAppMessage, instanceName: string, leadId?: string | null) {
  return {
    instance_name: instanceName,
    remote_jid: msg.key.remoteJid,
    message_id: msg.key.id,
    from_me: msg.key.fromMe,
    message_text: getMessageText(msg.message),
    message_type: msg.message ? (Object.keys(msg.message)[0] ?? null) : null,
    message_timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
    status: msg.status ?? null,
    raw_payload: msg.message ?? null,
    ...(leadId !== undefined ? { lead_id: leadId } : {}),
  };
}

export function toWhatsAppMessage(row: WhatsAppMessageRow): WhatsAppMessage {
  return {
    key: {
      id: row.message_id,
      remoteJid: row.remote_jid,
      fromMe: row.from_me,
    },
    message: row.raw_payload ?? undefined,
    messageTimestamp: Math.floor(new Date(row.message_timestamp).getTime() / 1000),
    status: row.status ?? undefined,
  };
}

export async function upsertMessages(messages: WhatsAppMessage[], instanceName: string, leadId?: string | null) {
  if (messages.length === 0) return;

  const { error } = await supabaseAdmin
    .from('whatsapp_messages')
    .upsert(messages.map(m => toSupabaseMessageRow(m, instanceName, leadId)), {
      onConflict: 'instance_name,remote_jid,message_id',
      ignoreDuplicates: true,
    });

  if (error) throw error;
}

export async function getLinkedLead(remoteJid: string, instanceName?: string) {
  const { data: leadByJid, error: leadByJidError } = await supabaseAdmin
    .from('leads')
    .select('id,nome,status')
    .eq('whatsapp_jid', remoteJid)
    .maybeSingle();

  if (leadByJidError) throw leadByJidError;
  if (leadByJid) return leadByJid;

  let messagesQuery = supabaseAdmin
    .from('whatsapp_messages')
    .select('lead_id, leads:lead_id(id,nome,status)')
    .eq('remote_jid', remoteJid)
    .not('lead_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (instanceName) {
    messagesQuery = messagesQuery.eq('instance_name', instanceName);
  }

  const { data: linkedMessage, error: linkedMessageError } = await messagesQuery.maybeSingle();
  if (linkedMessageError) throw linkedMessageError;

  return linkedMessage?.leads ?? null;
}
