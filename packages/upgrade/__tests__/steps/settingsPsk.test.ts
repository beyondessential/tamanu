import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_SETTINGS_PSK,
} from '@tamanu/constants';
import { generateSecretKey } from '@tamanu/shared/utils/crypto';

import { STEPS as CENTRAL_STEPS } from '../../src/steps/1785100000000-provisionCentralSettingsPsk.js';
import { STEPS as FACILITY_STEPS } from '../../src/steps/1785200000000-provisionFacilitySettingsPsk.js';

// No legacy crypto.settingsPsk configured -> central generates a fresh PSK.
vi.mock('config', () => ({ default: {} }));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const [centralStep] = CENTRAL_STEPS;
const [facilityStep] = FACILITY_STEPS;

const makeArgs = (
  serverType: string,
  facts: Record<string, string> = {},
  secrets: Record<string, string> = {},
) => {
  const factStore = new Map(Object.entries(facts));
  const secretStore = new Map(Object.entries(secrets));
  return {
    args: {
      serverType,
      models: {
        LocalSystemFact: {
          get: vi.fn(async (k: string) => factStore.get(k) ?? null),
        },
        LocalSystemSecret: {
          get: vi.fn(async (k: string) => secretStore.get(k) ?? null),
          setIfAbsent: vi.fn(async (k: string, v: string) => {
            if (!secretStore.has(k)) secretStore.set(k, v);
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
const HEX64 = /^[0-9a-f]{64}$/;

beforeEach(() => mockFetch.mockReset());

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

describe('1785200000000-provisionFacilitySettingsPsk', () => {
  const configured = {
    [FACT_CENTRAL_HOST]: 'https://central.example.com/',
    [FACT_SYNC_EMAIL]: 'facility@sync.tamanu',
    [FACT_DEVICE_ID]: 'facility-device-1',
  };
  const withPassword = { [FACT_SYNC_PASSWORD]: 'sync-password' };

  it('runs only on a configured facility', async () => {
    expect(await facilityStep.check(makeArgs('central', configured).args)).toBe(false);
    expect(await facilityStep.check(makeArgs('facility', {}).args)).toBe(false);
    expect(await facilityStep.check(makeArgs('facility', configured).args)).toBe(true);
  });

  it('pulls the PSK from central and stores it', async () => {
    const CENTRAL_PSK = (await generateSecretKey()).toString('hex');
    mockFetch.mockImplementation(async (url: string) => {
      if (url?.endsWith('/api/login')) return jsonResponse({ token: 'tok' });
      if (url?.endsWith('/api/admin/settingsPsk')) return jsonResponse({ settingsPsk: CENTRAL_PSK });
      return jsonResponse({}); // tolerate unrelated calls; real calls asserted below
    });
    const { args, secretStore } = makeArgs('facility', configured, withPassword);
    await facilityStep.run(args);
    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(CENTRAL_PSK);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://central.example.com/api/admin/settingsPsk',
      expect.objectContaining({ headers: { Authorization: 'Bearer tok' } }),
    );
  });

  it('no-ops (no network) when the PSK is already present', async () => {
    const { args, secretStore } = makeArgs('facility', configured, {
      ...withPassword,
      [FACT_SETTINGS_PSK]: 'existing-psk',
    });
    await facilityStep.run(args);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe('existing-psk');
  });

  it('is failure-tolerant when central is unreachable — warns, stores nothing, does not throw', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 502 });
    const { args, secretStore } = makeArgs('facility', configured, withPassword);
    await expect(facilityStep.run(args)).resolves.not.toThrow();
    expect(secretStore.has(FACT_SETTINGS_PSK)).toBe(false);
    expect(args.log.warn).toHaveBeenCalled();
  });

  it('skips (no network) when sync config is incomplete', async () => {
    const { args, secretStore } = makeArgs('facility', configured, {}); // no password
    await facilityStep.run(args);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(secretStore.has(FACT_SETTINGS_PSK)).toBe(false);
    expect(args.log.warn).toHaveBeenCalled();
  });
});
