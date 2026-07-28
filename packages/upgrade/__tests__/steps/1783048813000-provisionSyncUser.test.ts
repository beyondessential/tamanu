import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_CENTRAL_HOST, FACT_SYNC_EMAIL, FACT_SYNC_PASSWORD } from '@tamanu/constants';
import { STEPS } from '../../src/steps/1783048813000-provisionSyncUser.js';

vi.mock('config', () => ({
  default: {
    sync: {
      host: 'https://central.example.com/',
      email: 'legacy@sync.tamanu',
      password: 'legacy-password',
    },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const [recordStep] = STEPS;

const LEGACY_EMAIL = 'legacy@sync.tamanu';

const makeArgs = (facts: Record<string, string> = {}) => {
  const factStore = new Map(Object.entries(facts));
  const secretStore = new Map<string, string>();
  return {
    args: {
      serverType: 'facility',
      sequelize: { transaction: async (callback: () => Promise<void>) => callback() },
      models: {
        LocalSystemFact: {
          get: vi.fn(async (key: string) => factStore.get(key) ?? null),
          set: vi.fn(async (key: string, value: string) => void factStore.set(key, value)),
        },
        LocalSystemSecret: {
          get: vi.fn(async (key: string) => secretStore.get(key) ?? null),
          set: vi.fn(async (key: string, value: string) => void secretStore.set(key, value)),
          setIfAbsent: vi.fn(async (key: string, value: string) => {
            if (!secretStore.has(key)) secretStore.set(key, value);
          }),
        },
      },
      log: { info: vi.fn(), warn: vi.fn() },
    } as any,
    factStore,
    secretStore,
  };
};

describe('1783048813000-provisionSyncUser', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('records legacy credentials only on facility servers that have none yet', async () => {
    const { args } = makeArgs();
    await expect(recordStep.check(args)).resolves.toBe(true);
    await expect(recordStep.check({ ...args, serverType: 'central' })).resolves.toBe(false);
    const { args: configured } = makeArgs({ [FACT_SYNC_EMAIL]: 'sync.abc@sync.tamanu' });
    await expect(recordStep.check(configured)).resolves.toBe(false);
  });

  it('records the legacy credentials without touching the network', async () => {
    const { args, factStore, secretStore } = makeArgs();

    await recordStep.run(args);

    // the whole point: no central round-trip, so this cannot fail
    expect(mockFetch).not.toHaveBeenCalled();
    expect(factStore.get(FACT_CENTRAL_HOST)).toBe('https://central.example.com');
    expect(factStore.get(FACT_SYNC_EMAIL)).toBe(LEGACY_EMAIL);
    expect(secretStore.get(FACT_SYNC_PASSWORD)).toBe('legacy-password');
  });

  it('is the only step left — the swap to a dedicated user rides a sync session', () => {
    expect(STEPS).toHaveLength(1);
  });
});
