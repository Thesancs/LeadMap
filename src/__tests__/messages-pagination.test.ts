import { describe, it, expect } from 'vitest';
import type { WhatsAppMessage } from '@/types';

// ─── Inline helpers mirroring src/app/api/whatsapp/messages/[instance]/route.ts
// These are tested here because the route file is not importable in isolation.

type SupabaseRow = {
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
  created_at: string;
};

function toSupabaseRow(msg: WhatsAppMessage, instanceName: string) {
  return {
    instance_name: instanceName,
    remote_jid: msg.key.remoteJid,
    message_id: msg.key.id,
    from_me: msg.key.fromMe,
    message_text:
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      null,
    message_type: msg.message ? (Object.keys(msg.message)[0] ?? null) : null,
    message_timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
    status: msg.status ?? null,
    raw_payload: msg.message ?? null,
  };
}

function toWhatsAppMessage(row: SupabaseRow): WhatsAppMessage {
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

// ─── Tests ──────────────────────────────────────────────────────────────────

const INSTANCE = 'leadmap_001';
const JID = '5511999990000@s.whatsapp.net';

function makeMessage(overrides: Partial<WhatsAppMessage> = {}): WhatsAppMessage {
  return {
    key: { id: 'msg-1', remoteJid: JID, fromMe: false },
    message: { conversation: 'Hello' },
    messageTimestamp: 1700000000,
    status: 'READ',
    ...overrides,
  };
}

describe('toSupabaseRow', () => {
  it('maps all fields correctly', () => {
    const msg = makeMessage();
    const row = toSupabaseRow(msg, INSTANCE);

    expect(row.instance_name).toBe(INSTANCE);
    expect(row.remote_jid).toBe(JID);
    expect(row.message_id).toBe('msg-1');
    expect(row.from_me).toBe(false);
    expect(row.message_text).toBe('Hello');
    expect(row.message_type).toBe('conversation');
    expect(row.status).toBe('READ');
    expect(row.raw_payload).toEqual({ conversation: 'Hello' });
  });

  it('converts messageTimestamp (seconds) to ISO string', () => {
    const msg = makeMessage({ messageTimestamp: 1700000000 });
    const row = toSupabaseRow(msg, INSTANCE);
    expect(row.message_timestamp).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it('extracts text from extendedTextMessage', () => {
    const msg = makeMessage({ message: { extendedTextMessage: { text: 'Extended' } } });
    const row = toSupabaseRow(msg, INSTANCE);
    expect(row.message_text).toBe('Extended');
    expect(row.message_type).toBe('extendedTextMessage');
  });

  it('sets message_text to null for non-text messages', () => {
    const msg = makeMessage({ message: { imageMessage: { caption: 'photo' } } });
    const row = toSupabaseRow(msg, INSTANCE);
    expect(row.message_text).toBeNull();
    expect(row.message_type).toBe('imageMessage');
  });

  it('handles missing message field', () => {
    const msg = makeMessage({ message: undefined });
    const row = toSupabaseRow(msg, INSTANCE);
    expect(row.message_text).toBeNull();
    expect(row.message_type).toBeNull();
    expect(row.raw_payload).toBeNull();
  });

  it('sets status to null when absent', () => {
    const msg = makeMessage({ status: undefined });
    const row = toSupabaseRow(msg, INSTANCE);
    expect(row.status).toBeNull();
  });
});

describe('toWhatsAppMessage', () => {
  function makeRow(overrides: Partial<SupabaseRow> = {}): SupabaseRow {
    return {
      id: 'uuid-1',
      instance_name: INSTANCE,
      remote_jid: JID,
      message_id: 'msg-1',
      from_me: false,
      message_text: 'Hello',
      message_type: 'conversation',
      message_timestamp: new Date(1700000000 * 1000).toISOString(),
      status: 'READ',
      raw_payload: { conversation: 'Hello' },
      created_at: '2024-01-01T00:00:00Z',
      ...overrides,
    };
  }

  it('reconstructs a WhatsAppMessage from a DB row', () => {
    const msg = toWhatsAppMessage(makeRow());
    expect(msg.key.id).toBe('msg-1');
    expect(msg.key.remoteJid).toBe(JID);
    expect(msg.key.fromMe).toBe(false);
    expect(msg.messageTimestamp).toBe(1700000000);
    expect(msg.status).toBe('READ');
    expect(msg.message).toEqual({ conversation: 'Hello' });
  });

  it('round-trips through toSupabaseRow → toWhatsAppMessage', () => {
    const original = makeMessage();
    const row = { ...toSupabaseRow(original, INSTANCE), id: 'uuid', created_at: '' } as SupabaseRow;
    const recovered = toWhatsAppMessage(row);

    expect(recovered.key).toEqual(original.key);
    expect(recovered.messageTimestamp).toBe(original.messageTimestamp);
    expect(recovered.status).toBe(original.status);
    expect(recovered.message).toEqual(original.message);
  });

  it('sets message to undefined when raw_payload is null', () => {
    const msg = toWhatsAppMessage(makeRow({ raw_payload: null }));
    expect(msg.message).toBeUndefined();
  });

  it('sets status to undefined when null in row', () => {
    const msg = toWhatsAppMessage(makeRow({ status: null }));
    expect(msg.status).toBeUndefined();
  });
});

// ─── Pagination cursor logic ─────────────────────────────────────────────────

describe('pagination cursor semantics', () => {
  it('hasMore is true when API returns more rows than pageSize', () => {
    const pageSize = 3;
    const rows: SupabaseRow[] = Array.from({ length: pageSize + 1 }, (_, i) => ({
      id: `uuid-${i}`,
      instance_name: INSTANCE,
      remote_jid: JID,
      message_id: `msg-${i}`,
      from_me: false,
      message_text: null,
      message_type: null,
      message_timestamp: new Date((1700000000 + i) * 1000).toISOString(),
      status: null,
      raw_payload: null,
      created_at: '',
    }));

    const page = rows.slice(0, pageSize);
    const hasMore = rows.length > pageSize;
    const nextCursor = hasMore ? page[page.length - 1].message_timestamp : null;

    expect(hasMore).toBe(true);
    expect(nextCursor).toBe(page[2].message_timestamp);
  });

  it('hasMore is false when API returns exactly pageSize rows', () => {
    const pageSize = 3;
    const rows: SupabaseRow[] = Array.from({ length: pageSize }, (_, i) => ({
      id: `uuid-${i}`,
      instance_name: INSTANCE,
      remote_jid: JID,
      message_id: `msg-${i}`,
      from_me: false,
      message_text: null,
      message_type: null,
      message_timestamp: new Date((1700000000 + i) * 1000).toISOString(),
      status: null,
      raw_payload: null,
      created_at: '',
    }));

    const hasMore = rows.length > pageSize;
    expect(hasMore).toBe(false);
  });
});
