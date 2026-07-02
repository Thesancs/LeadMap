import type { WhatsAppChat } from '@/types';

const SELF_NAMES = new Set(['voce', 'você', 'you', 'me', 'eu']);

export function getChatDisplayName(chat: WhatsAppChat): string {
  const name = chat.pushName?.trim();
  if (name && !SELF_NAMES.has(name.toLowerCase())) return name;
  return chat.remoteJid.split('@')[0];
}
