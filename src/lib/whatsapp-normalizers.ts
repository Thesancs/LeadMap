import type { WhatsAppChat, WhatsAppMessage } from '@/types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isSelfName(value: string) {
  return ['voce', 'você', 'you', 'me', 'eu'].includes(value.trim().toLowerCase());
}

function asContactName(value: unknown): string | undefined {
  const text = asString(value)?.trim();
  if (!text || isSelfName(text)) return undefined;
  return text;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asTimestamp(value: unknown): number {
  const numeric = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : NaN;

  if (!Number.isFinite(numeric)) return Math.floor(Date.now() / 1000);

  return numeric > 9999999999 ? Math.floor(numeric / 1000) : Math.floor(numeric);
}

function asOptionalTimestamp(value: unknown): number | undefined {
  const numeric = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : NaN;

  if (!Number.isFinite(numeric)) return undefined;
  return numeric > 9999999999 ? Math.floor(numeric / 1000) : Math.floor(numeric);
}

function extractMessageArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  const messages = root.messages;

  if (Array.isArray(messages)) return messages;

  const messagesRecord = asRecord(messages);
  if (Array.isArray(messagesRecord.records)) return messagesRecord.records;

  if (Array.isArray(root.records)) return root.records;
  if (Array.isArray(root.data)) return root.data;
  if (isRecord(root.key) || isRecord(root.message)) return [root];

  const dataRecord = asRecord(root.data);
  if (Array.isArray(dataRecord.messages)) return dataRecord.messages;
  if (Array.isArray(dataRecord.records)) return dataRecord.records;
  if (isRecord(dataRecord.key) || isRecord(dataRecord.message)) return [dataRecord];

  const dataMessagesRecord = asRecord(dataRecord.messages);
  if (Array.isArray(dataMessagesRecord.records)) return dataMessagesRecord.records;

  return [];
}

function extractChatArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (Array.isArray(root.chats)) return root.chats;
  if (Array.isArray(root.records)) return root.records;
  if (Array.isArray(root.data)) return root.data;

  const dataRecord = asRecord(root.data);
  if (Array.isArray(dataRecord.chats)) return dataRecord.chats;
  if (Array.isArray(dataRecord.records)) return dataRecord.records;

  return [];
}

function extractLastMessage(record: UnknownRecord): WhatsAppChat['lastMessage'] {
  const lastMessage = asRecord(record.lastMessage);
  const lastMessageMessage = asRecord(lastMessage.message);
  const recordMessage = asRecord(record.message);

  if (Object.keys(lastMessageMessage).length > 0) {
    return { message: lastMessageMessage };
  }

  if (Object.keys(recordMessage).length > 0) {
    return { message: recordMessage };
  }

  return undefined;
}

export function normalizeEvolutionChats(payload: unknown): WhatsAppChat[] {
  return extractChatArray(payload)
    .map((item, index) => {
      const record = asRecord(item);
      const key = asRecord(record.key);
      const lastMessage = asRecord(record.lastMessage);
      const lastMessageKey = asRecord(lastMessage.key);
      const contact = asRecord(record.contact);
      const profile = asRecord(record.profile);
      const lastMessageFromMe = asBoolean(lastMessageKey.fromMe) ?? asBoolean(lastMessage.fromMe) ?? false;

      const remoteJid =
        asString(record.remoteJid) ||
        asString(record.id) ||
        asString(record.chatId) ||
        asString(key.remoteJid) ||
        asString(lastMessageKey.remoteJid) ||
        '';

      const timestamp =
        asOptionalTimestamp(record.messageTimestamp) ??
        asOptionalTimestamp(record.timestamp) ??
        asOptionalTimestamp(record.updatedAt) ??
        asOptionalTimestamp(record.createdAt) ??
        asOptionalTimestamp(lastMessage.messageTimestamp) ??
        asOptionalTimestamp(lastMessage.timestamp) ??
        Math.floor(Date.now() / 1000);

      return {
        id: asString(record.id) || remoteJid || `chat-${index}`,
        remoteJid,
        pushName:
          asContactName(record.name) ||
          asContactName(record.verifiedName) ||
          asContactName(record.profileName) ||
          asContactName(record.notifyName) ||
          asContactName(record.contactName) ||
          asContactName(contact.name) ||
          asContactName(contact.pushName) ||
          asContactName(profile.name) ||
          asContactName(record.pushName) ||
          (!lastMessageFromMe ? asContactName(lastMessage.pushName) : undefined),
        profilePicUrl:
          asString(record.profilePicUrl) ||
          asString(record.profilePictureUrl) ||
          asString(record.profilePicture) ||
          asString(record.picture) ||
          asString(record.avatar),
        unreadCount: Number(record.unreadCount || 0),
        messageTimestamp: timestamp,
        lastMessage: extractLastMessage(record),
      };
    })
    .filter(chat => chat.remoteJid && !chat.remoteJid.includes('@g.us'))
    .sort((a, b) => b.messageTimestamp - a.messageTimestamp);
}

export function normalizeEvolutionMessages(payload: unknown, fallbackRemoteJid: string): WhatsAppMessage[] {
  return extractMessageArray(payload)
    .map((item, index) => {
      const record = asRecord(item);
      const key = asRecord(record.key);
      const message = asRecord(record.message);

      const remoteJid =
        asString(key.remoteJid) ||
        asString(record.remoteJid) ||
        asString(record.chatId) ||
        fallbackRemoteJid;

      const id =
        asString(key.id) ||
        asString(record.id) ||
        asString(record.messageId) ||
        `${remoteJid}-${record.messageTimestamp || record.timestamp || index}`;

      return {
        key: {
          id,
          remoteJid,
          fromMe: asBoolean(key.fromMe) ?? asBoolean(record.fromMe) ?? false,
        },
        message,
        messageTimestamp: asTimestamp(record.messageTimestamp ?? record.timestamp ?? record.createdAt),
        status: asString(record.status),
      };
    })
    .sort((a, b) => a.messageTimestamp - b.messageTimestamp);
}
