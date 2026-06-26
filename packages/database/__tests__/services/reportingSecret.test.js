import { describe, expect, it } from 'vitest';
import { isReportingSecretStale } from '../../src/services/reporting';

const daysAgo = days => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('isReportingSecretStale', () => {
  it('is not stale when rotation is disabled (0 days)', () => {
    expect(isReportingSecretStale(daysAgo(999), 0)).toBe(false);
  });

  it('is not stale when there is no rotation timestamp yet', () => {
    expect(isReportingSecretStale(null, 90)).toBe(false);
  });

  it('is not stale before the threshold', () => {
    expect(isReportingSecretStale(daysAgo(10), 90)).toBe(false);
  });

  it('is stale once past the threshold', () => {
    expect(isReportingSecretStale(daysAgo(120), 90)).toBe(true);
  });
});
