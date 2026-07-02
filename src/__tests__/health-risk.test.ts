import { describe, it, expect } from 'vitest';
import { calculateRisk, WARN_THRESHOLD, BLOCK_THRESHOLD } from '@/lib/health-utils';

describe('calculateRisk', () => {
  it('returns healthy when pct is below warn threshold and status is open', () => {
    expect(calculateRisk(0, 'open')).toBe('healthy');
    expect(calculateRisk(WARN_THRESHOLD - 1, 'open')).toBe('healthy');
  });

  it('returns warning at exactly the warn threshold', () => {
    expect(calculateRisk(WARN_THRESHOLD, 'open')).toBe('warning');
  });

  it('returns warning between warn and block thresholds', () => {
    expect(calculateRisk(WARN_THRESHOLD + 1, 'open')).toBe('warning');
    expect(calculateRisk(BLOCK_THRESHOLD - 1, 'open')).toBe('warning');
  });

  it('returns blocked at exactly the block threshold', () => {
    expect(calculateRisk(BLOCK_THRESHOLD, 'open')).toBe('blocked');
  });

  it('returns blocked when over the block threshold', () => {
    expect(calculateRisk(BLOCK_THRESHOLD + 1, 'open')).toBe('blocked');
    expect(calculateRisk(200, 'open')).toBe('blocked');
  });

  it('returns blocked when status is close regardless of pct', () => {
    expect(calculateRisk(0, 'close')).toBe('blocked');
    expect(calculateRisk(50, 'close')).toBe('blocked');
    expect(calculateRisk(BLOCK_THRESHOLD, 'close')).toBe('blocked');
  });

  it('returns blocked when status is connecting regardless of pct', () => {
    expect(calculateRisk(0, 'connecting')).toBe('blocked');
    expect(calculateRisk(50, 'connecting')).toBe('blocked');
  });
});
