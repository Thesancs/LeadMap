import { supabaseAdmin } from './supabase';
import { WhatsAppInstance } from '@/types';

type InstanceWithCount = WhatsAppInstance & { current_count: number };

/** Pure: filter instances below daily limit, sorted LRU (null last_used_at first). */
export function selectCandidates(instances: InstanceWithCount[]): InstanceWithCount[] {
  return instances
    .filter((inst) => inst.current_count < inst.daily_limit)
    .sort((a, b) => {
      if (!a.last_used_at) return -1;
      if (!b.last_used_at) return 1;
      return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime();
    });
}

export async function getNextWhatsAppInstance(): Promise<WhatsAppInstance | null> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Fetch all open instances
  const { data: instances, error } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('*')
    .eq('status', 'open');

  if (error) {
    console.error('[round-robin] Error fetching instances:', error.message);
    return null;
  }
  if (!instances || instances.length === 0) return null;

  // 2. Count only successful sends today per instance (failures don't consume quota)
  const withCounts = await Promise.all(
    instances.map(async (inst) => {
      const { count, error: countError } = await supabaseAdmin
        .from('message_logs')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', inst.id)
        .eq('channel', 'whatsapp')
        .eq('status', 'sent')
        .gte('created_at', todayStart.toISOString());

      if (countError) {
        console.error(
          `[round-robin] Error counting messages for ${inst.instance_name}:`,
          countError.message,
        );
      }

      return { ...inst, current_count: count ?? 0 };
    }),
  );

  // 3. Keep only instances below their daily limit, sorted LRU
  const candidates = selectCandidates(withCounts);

  if (candidates.length === 0) {
    console.warn('[round-robin] All instances are at daily limit or unavailable.');
    return null;
  }

  // 4. CAS claim: update last_used_at only if it hasn't changed since we read it.
  //    Tries each candidate in LRU order until one is successfully claimed.
  const now = new Date().toISOString();

  for (const candidate of candidates) {
    const baseQuery = supabaseAdmin
      .from('whatsapp_instances')
      .update({ last_used_at: now })
      .eq('id', candidate.id);

    const { data: claimed } = await (
      candidate.last_used_at === null
        ? baseQuery.is('last_used_at', null)
        : baseQuery.eq('last_used_at', candidate.last_used_at)
    )
      .select('id')
      .maybeSingle();

    if (claimed) {
      return { ...candidate, last_used_at: now } as WhatsAppInstance;
    }

    // Another concurrent request claimed this instance first — try the next one
    console.warn(
      `[round-robin] CAS miss on ${candidate.instance_name}, trying next candidate.`,
    );
  }

  console.error('[round-robin] All candidates were claimed by concurrent requests.');
  return null;
}
