import { describe, it, expect, vi } from 'vitest';
import { FACT_SETTINGS_PSK } from '@tamanu/constants';

import { STEPS as CENTRAL_STEPS } from '../../src/steps/1785100000000-provisionCentralSettingsPsk.js';

// No legacy crypto.settingsPsk configured -> central generates a fresh PSK.
vi.mock('config', () => ({ default: {} }));

const [centralStep] = CENTRAL_STEPS;

const makeArgs = (serverType: string, secrets: Record<string, string> = {}) => {
  const secretStore = new Map(Object.entries(secrets));
  return {
    args: {
      serverType,
      models: {
        LocalSystemSecret: {
          get: vi.fn(async (k: string) => secretStore.get(k) ?? null),
          setIfAbsent: vi.fn(async (k: string, v: string) => {
            if (!secretStore.has(k)) secretStore.set(k, v);
          }),
        },
      },
      log: { info: vi.fn(), warn: vi.fn() },
    } as any,
    secretStore,
  };
};

const HEX64 = /^[0-9a-f]{64}$/;

describe('1785100000000-provisionCentralSettingsPsk', () => {
  it('runs on central only', async () => {
    expect(await centralStep.check(makeArgs('central').args)).toBe(true);
    expect(await centralStep.check(makeArgs('facility').args)).toBe(false);
  });

  it('generates a 32-byte PSK when none exists', async () => {
    const { args, secretStore } = makeArgs('central');
    await centralStep.run(args);
    expect(secretStore.get(FACT_SETTINGS_PSK)).toMatch(HEX64);
  });

  it('is idempotent — a second run keeps the same PSK', async () => {
    const { args, secretStore } = makeArgs('central');
    await centralStep.run(args);
    const first = secretStore.get(FACT_SETTINGS_PSK);
    await centralStep.run(args);
    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(first);
  });
});
