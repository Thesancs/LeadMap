import { describe, it, expect, vi } from 'vitest';

// Prevent Supabase client instantiation (no env vars in test environment)
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: {} }));

import { selectCandidates } from '@/lib/round-robin';
import type { WhatsAppInstance } from '@/types';

function makeInstance(
  overrides: Partial<WhatsAppInstance & { current_count: number }>,
): WhatsAppInstance & { current_count: number } {
  return {
    id: 'inst-1',
    instance_name: 'leadmap_test',
    display_name: 'Test',
    phone_number: null,
    status: 'open',
    assigned_to: null,
    last_used_at: null,
    warmup_started_at: null,
    warmup_days_current: 0,
    warmup_days_total: 14,
    daily_limit: 80,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    current_count: 0,
    ...overrides,
  };
}

describe('selectCandidates', () => {
  it('returns all instances when all are below the limit', () => {
    const instances = [
      makeInstance({ id: 'a', current_count: 10, daily_limit: 80 }),
      makeInstance({ id: 'b', current_count: 20, daily_limit: 80 }),
    ];
    expect(selectCandidates(instances)).toHaveLength(2);
  });

  it('excludes instances at their daily limit', () => {
    const instances = [
      makeInstance({ id: 'at-limit', current_count: 80, daily_limit: 80 }),
      makeInstance({ id: 'below', current_count: 79, daily_limit: 80 }),
    ];
    const result = selectCandidates(instances);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('below');
  });

  it('excludes instances over their daily limit', () => {
    const instances = [
      makeInstance({ id: 'over', current_count: 81, daily_limit: 80 }),
    ];
    expect(selectCandidates(instances)).toHaveLength(0);
  });

  it('returns [] when all instances are at or over the limit', () => {
    const instances = [
      makeInstance({ id: 'a', current_count: 80, daily_limit: 80 }),
      makeInstance({ id: 'b', current_count: 100, daily_limit: 80 }),
    ];
    expect(selectCandidates(instances)).toHaveLength(0);
  });

  it('places instances with null last_used_at first (never used)', () => {
    const instances = [
      makeInstance({ id: 'used', last_used_at: '2024-06-01T12:00:00Z', current_count: 10 }),
      makeInstance({ id: 'never', last_used_at: null, current_count: 5 }),
    ];
    const result = selectCandidates(instances);
    expect(result[0].id).toBe('never');
    expect(result[1].id).toBe('used');
  });

  it('sorts by last_used_at ascending (oldest first)', () => {
    const instances = [
      makeInstance({ id: 'recent', last_used_at: '2024-06-03T10:00:00Z', current_count: 10 }),
      makeInstance({ id: 'oldest', last_used_at: '2024-06-01T10:00:00Z', current_count: 10 }),
      makeInstance({ id: 'middle', last_used_at: '2024-06-02T10:00:00Z', current_count: 10 }),
    ];
    const result = selectCandidates(instances);
    expect(result.map(i => i.id)).toEqual(['oldest', 'middle', 'recent']);
  });

  it('returns empty array for empty input', () => {
    expect(selectCandidates([])).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const instances = [
      makeInstance({ id: 'a', current_count: 10 }),
      makeInstance({ id: 'b', current_count: 20 }),
    ];
    const copy = [...instances];
    selectCandidates(instances);
    expect(instances).toEqual(copy);
  });
});
