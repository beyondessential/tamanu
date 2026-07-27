import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_SETTINGS_PSK,
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

const [step] = STEPS;

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

const jsonResponse = (body: unknown) => ({ ok: true, json: async () => body });

describe('1783048813000-provisionSyncUser', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('checks in only on facility servers with legacy config and no email fact', async () => {
    const { args } = makeArgs();
    await expect(step.check(args)).resolves.toBe(true);
    await expect(step.check({ ...args, serverType: 'central' })).resolves.toBe(false);
    const { args: configured } = makeArgs({ [FACT_SYNC_EMAIL]: 'sync.abc@sync.tamanu' });
    await expect(step.check(configured)).resolves.toBe(false);
  });

  it('provisions a dedicated sync user and records it in facts', async () => {
    const { args, factStore, secretStore } = makeArgs({
      [FACT_DEVICE_ID]: 'device-1',
      [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
    });
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ token: 'a-token' }))
      .mockResolvedValueOnce(jsonResponse({ email: 'sync.abc@sync.tamanu', password: 'minted' }));

    await step.run(args);

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

  it('stores the settings PSK when central returns one', async () => {
    const { args, secretStore } = makeArgs({
      [FACT_DEVICE_ID]: 'device-1',
      [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
    });
    const psk = 'ab'.repeat(32); // 64 hex chars
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ token: 'a-token' }))
      .mockResolvedValueOnce(
        jsonResponse({ email: 'sync.abc@sync.tamanu', password: 'minted', settingsPsk: psk }),
      );

    await step.run(args);

    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(psk);
  });

  it('leaves the server on config fallback when central refuses', async () => {
    const { args, factStore } = makeArgs({
      [FACT_DEVICE_ID]: 'device-1',
      [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
    });
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    await expect(step.run(args)).resolves.toBeUndefined(); // must not throw — it would fail the upgrade
    expect(factStore.has(FACT_SYNC_EMAIL)).toBe(false);
    expect(args.log.warn).toHaveBeenCalled();
  });

  it('skips servers that never registered with central', async () => {
    const { args, factStore } = makeArgs();
    await step.run(args);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(factStore.has(FACT_SYNC_EMAIL)).toBe(false);
  });
});
