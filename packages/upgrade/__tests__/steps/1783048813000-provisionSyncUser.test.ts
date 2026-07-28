import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
} from '@tamanu/constants';
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

const [recordStep, provisionStep] = STEPS;

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
          set: vi.fn(async (key: string, value: string) => void secretStore.set(key, value)),
        },
      },
      log: { info: vi.fn(), warn: vi.fn() },
    } as any,
    factStore,
    secretStore,
  };
};

const jsonResponse = (body: unknown) => ({ ok: true, json: async () => body });

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

  it('provisions a dedicated user only while the recorded email is still the legacy one', async () => {
    const { args: legacy } = makeArgs({ [FACT_SYNC_EMAIL]: LEGACY_EMAIL });
    await expect(provisionStep.check(legacy)).resolves.toBe(true);
    const { args: dedicated } = makeArgs({ [FACT_SYNC_EMAIL]: 'sync.abc@sync.tamanu' });
    await expect(provisionStep.check(dedicated)).resolves.toBe(false);
  });

  it('provisions a dedicated sync user and records it in facts', async () => {
    const { args, factStore, secretStore } = makeArgs({
      [FACT_DEVICE_ID]: 'device-1',
      [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
    });
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ token: 'a-token' }))
      .mockResolvedValueOnce(jsonResponse({ email: 'sync.abc@sync.tamanu', password: 'minted' }));

    await provisionStep.run(args);

    // login with legacy creds, then provision with the token
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://central.example.com/api/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://central.example.com/api/admin/syncCredentials',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer a-token' }),
      }),
    );
    expect(factStore.get(FACT_CENTRAL_HOST)).toBe('https://central.example.com');
    expect(factStore.get(FACT_SYNC_EMAIL)).toBe('sync.abc@sync.tamanu');
    expect(factStore.get(FACT_FACILITY_IDS)).toBe(JSON.stringify(['facility-a']));
    expect(secretStore.get(FACT_SYNC_PASSWORD)).toBe('minted');
  });

  it('leaves the recorded legacy credentials in place when central refuses', async () => {
    const { args, factStore } = makeArgs({
      [FACT_DEVICE_ID]: 'device-1',
      [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
      [FACT_SYNC_EMAIL]: LEGACY_EMAIL, // as the record step left it
    });
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    await expect(provisionStep.run(args)).resolves.toBeUndefined(); // must not throw — it would fail the upgrade
    // still on the legacy credentials the record step wrote, so sync keeps working
    expect(factStore.get(FACT_SYNC_EMAIL)).toBe(LEGACY_EMAIL);
    expect(args.log.warn).toHaveBeenCalled();
  });

  it('skips provisioning on servers that never registered with central', async () => {
    const { args } = makeArgs({ [FACT_SYNC_EMAIL]: LEGACY_EMAIL });
    await provisionStep.run(args);
    expect(mockFetch).not.toHaveBeenCalled();
    // untouched: no dedicated user, but the legacy credentials still sync
    expect(args.log.warn).toHaveBeenCalled();
  });
});
