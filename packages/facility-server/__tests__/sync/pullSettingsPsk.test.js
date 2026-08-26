import { afterEach, describe, expect, it, vi } from 'vitest';
import { FACT_SETTINGS_PSK } from '@tamanu/constants';
import { getSettingsPskKeyBuffer, setSettingsPskSource } from '@tamanu/shared/utils/crypto';

import { pullSettingsPsk } from '../../app/sync/pullSettingsPsk';

const CENTRAL_PSK = 'ab'.repeat(32);
const STALE_PSK = 'cd'.repeat(32);

const makeArgs = (secrets = {}) => {
  const secretStore = new Map(Object.entries(secrets));
  const fetch = vi.fn();
  return {
    args: {
      models: {
        LocalSystemSecret: {
          get: vi.fn(async key => secretStore.get(key) ?? null),
          setIfAbsent: vi.fn(async (key, value) => {
            if (!secretStore.has(key)) secretStore.set(key, value);
          }),
        },
      },
      centralServer: { fetch },
    },
    secretStore,
    fetch,
  };
};

describe('pullSettingsPsk', () => {
  afterEach(() => setSettingsPskSource(null));

  it('stores the PSK central returns', async () => {
    const { args, secretStore, fetch } = makeArgs();
    fetch.mockResolvedValue({ settingsPsk: CENTRAL_PSK });

    await pullSettingsPsk(args);

    expect(fetch).toHaveBeenCalledWith('admin/settingsPsk');
    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(CENTRAL_PSK);
  });

  it('drops a key buffer cached before the pull', async () => {
    const { args, secretStore, fetch } = makeArgs();
    fetch.mockResolvedValue({ settingsPsk: CENTRAL_PSK });

    setSettingsPskSource(async () => secretStore.get(FACT_SETTINGS_PSK) ?? STALE_PSK);
    expect((await getSettingsPskKeyBuffer()).toString('hex')).toBe(STALE_PSK);

    await pullSettingsPsk(args);

    expect((await getSettingsPskKeyBuffer()).toString('hex')).toBe(CENTRAL_PSK);
  });

  it('does not touch the network when a PSK is already stored', async () => {
    const { args, secretStore, fetch } = makeArgs({ [FACT_SETTINGS_PSK]: CENTRAL_PSK });

    await pullSettingsPsk(args);

    expect(fetch).not.toHaveBeenCalled();
    expect(secretStore.get(FACT_SETTINGS_PSK)).toBe(CENTRAL_PSK);
  });

  it('stores nothing when central has no PSK to give', async () => {
    const { args, secretStore, fetch } = makeArgs();
    fetch.mockResolvedValue({ settingsPsk: null });

    await pullSettingsPsk(args);

    expect(secretStore.has(FACT_SETTINGS_PSK)).toBe(false);
  });

  it('propagates a failed fetch for the caller to swallow', async () => {
    const { args, secretStore, fetch } = makeArgs();
    fetch.mockRejectedValue(new Error('central unreachable'));

    await expect(pullSettingsPsk(args)).rejects.toThrow('central unreachable');
    expect(secretStore.has(FACT_SETTINGS_PSK)).toBe(false);
  });
});
