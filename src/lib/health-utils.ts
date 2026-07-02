import type { WhatsAppInstance } from '@/types';

export type InstanceRisk = 'healthy' | 'warning' | 'blocked';

export const WARN_THRESHOLD = 70;   // % of daily_limit → warning
export const BLOCK_THRESHOLD = 100; // % of daily_limit → blocked

export function calculateRisk(
  pctLimit: number,
  status: WhatsAppInstance['status'],
): InstanceRisk {
  if (status !== 'open' || pctLimit >= BLOCK_THRESHOLD) return 'blocked';
  if (pctLimit >= WARN_THRESHOLD) return 'warning';
  return 'healthy';
}
