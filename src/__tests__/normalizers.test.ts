import { describe, it, expect } from 'vitest';
import {
  normalizeEvolutionMessages,
  normalizeEvolutionChats,
} from '@/lib/whatsapp-normalizers';

// ─── normalizeEvolutionMessages ─────────────────────────────────────────────

describe('normalizeEvolutionMessages', () => {
  const JID = '5511999990000@s.whatsapp.net';

  it('returns [] for empty array', () => {
    expect(normalizeEvolutionMessages([], JID)).toEqual([]);
  });

  it('returns [] for null / undefined', () => {
    expect(normalizeEvolutionMessages(null, JID)).toEqual([]);
    expect(normalizeEvolutionMessages(undefined, JID)).toEqual([]);
  });

  it('extracts messages from a bare array', () => {
    const payload = [
      { key: { id: 'msg1', remoteJid: JID, fromMe: false }, messageTimestamp: 1700000000 },
    ];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result).toHaveLength(1);
    expect(result[0].key.id).toBe('msg1');
    expect(result[0].key.remoteJid).toBe(JID);
    expect(result[0].key.fromMe).toBe(false);
  });

  it('extracts messages from { messages: [...] }', () => {
    const payload = { messages: [{ key: { id: 'msg2', remoteJid: JID, fromMe: true }, messageTimestamp: 1700000001 }] };
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result).toHaveLength(1);
    expect(result[0].key.id).toBe('msg2');
    expect(result[0].key.fromMe).toBe(true);
  });

  it('extracts messages from { messages: { records: [...] } }', () => {
    const payload = {
      messages: {
        records: [{ key: { id: 'msg3', remoteJid: JID, fromMe: false }, messageTimestamp: 1700000002 }],
      },
    };
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result).toHaveLength(1);
    expect(result[0].key.id).toBe('msg3');
  });

  it('falls back to fallbackRemoteJid when key.remoteJid is absent', () => {
    const payload = [{ key: { id: 'msg4', fromMe: false }, messageTimestamp: 1700000003 }];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result[0].key.remoteJid).toBe(JID);
  });

  it('converts millisecond timestamps to seconds', () => {
    const tsMs = 1700000000000; // 13 digits
    const payload = [{ key: { id: 'ms1', remoteJid: JID, fromMe: false }, messageTimestamp: tsMs }];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result[0].messageTimestamp).toBe(1700000000);
  });

  it('keeps second timestamps as-is', () => {
    const tsSec = 1700000000; // 10 digits
    const payload = [{ key: { id: 'sec1', remoteJid: JID, fromMe: false }, messageTimestamp: tsSec }];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result[0].messageTimestamp).toBe(1700000000);
  });

  it('sorts messages ascending by timestamp', () => {
    const payload = [
      { key: { id: 'b', remoteJid: JID, fromMe: false }, messageTimestamp: 1700000002 },
      { key: { id: 'a', remoteJid: JID, fromMe: false }, messageTimestamp: 1700000001 },
    ];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result.map(m => m.key.id)).toEqual(['a', 'b']);
  });

  it('extracts fromMe from record level when key.fromMe is missing', () => {
    const payload = [{ key: { id: 'msg5', remoteJid: JID }, fromMe: true, messageTimestamp: 1700000004 }];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result[0].key.fromMe).toBe(true);
  });

  it('defaults fromMe to false when absent', () => {
    const payload = [{ key: { id: 'msg6', remoteJid: JID }, messageTimestamp: 1700000005 }];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(result[0].key.fromMe).toBe(false);
  });

  it('generates a fallback id when key.id is missing', () => {
    const payload = [{ key: { remoteJid: JID, fromMe: false }, messageTimestamp: 1700000006 }];
    const result = normalizeEvolutionMessages(payload, JID);
    expect(typeof result[0].key.id).toBe('string');
    expect(result[0].key.id.length).toBeGreaterThan(0);
  });
});

// ─── normalizeEvolutionChats ─────────────────────────────────────────────────

describe('normalizeEvolutionChats', () => {
  it('returns [] for empty input', () => {
    expect(normalizeEvolutionChats([])).toEqual([]);
    expect(normalizeEvolutionChats(null)).toEqual([]);
  });

  it('normalises a bare array of chats', () => {
    const payload = [
      { id: 'chat1', remoteJid: '5511000001@s.whatsapp.net', pushName: 'Ana', messageTimestamp: 1700000010, unreadCount: 2 },
    ];
    const result = normalizeEvolutionChats(payload);
    expect(result).toHaveLength(1);
    expect(result[0].remoteJid).toBe('5511000001@s.whatsapp.net');
    expect(result[0].pushName).toBe('Ana');
    expect(result[0].unreadCount).toBe(2);
  });

  it('filters out group chats (@g.us)', () => {
    const payload = [
      { id: 'g1', remoteJid: '123456789@g.us', pushName: 'Grupo', messageTimestamp: 1700000020 },
      { id: 'c1', remoteJid: '5511000002@s.whatsapp.net', pushName: 'Bob', messageTimestamp: 1700000021 },
    ];
    const result = normalizeEvolutionChats(payload);
    expect(result).toHaveLength(1);
    expect(result[0].remoteJid).toBe('5511000002@s.whatsapp.net');
  });

  it('strips self-referential pushNames', () => {
    const selfNames = ['voce', 'você', 'you', 'me', 'eu', 'Você', 'ME'];
    for (const name of selfNames) {
      const payload = [{ id: 'c', remoteJid: '5511000003@s.whatsapp.net', pushName: name, messageTimestamp: 1700000030 }];
      const result = normalizeEvolutionChats(payload);
      expect(result[0].pushName).toBeUndefined();
    }
  });

  it('keeps a real pushName', () => {
    const payload = [{ id: 'c', remoteJid: '5511000004@s.whatsapp.net', pushName: 'Carlos', messageTimestamp: 1700000040 }];
    const result = normalizeEvolutionChats(payload);
    expect(result[0].pushName).toBe('Carlos');
  });

  it('sorts chats descending by timestamp', () => {
    const payload = [
      { id: 'old', remoteJid: '5511000005@s.whatsapp.net', messageTimestamp: 1700000001 },
      { id: 'new', remoteJid: '5511000006@s.whatsapp.net', messageTimestamp: 1700000002 },
    ];
    const result = normalizeEvolutionChats(payload);
    expect(result.map(c => c.id)).toEqual(['new', 'old']);
  });

  it('extracts chats from { chats: [...] }', () => {
    const payload = {
      chats: [{ id: 'wrapped', remoteJid: '5511000007@s.whatsapp.net', messageTimestamp: 1700000050 }],
    };
    const result = normalizeEvolutionChats(payload);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('wrapped');
  });

  it('falls back to remoteJid as id when id is missing', () => {
    const payload = [{ remoteJid: '5511000008@s.whatsapp.net', messageTimestamp: 1700000060 }];
    const result = normalizeEvolutionChats(payload);
    expect(result[0].id).toBe('5511000008@s.whatsapp.net');
  });
});
