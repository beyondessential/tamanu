import {
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_SETTINGS_PSK,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  USER_KINDS,
} from '@tamanu/constants';

import { convergeSyncUser } from '../../app/sync/convergeSyncUser';
import { getSyncConfig } from '../../app/serverConfig';

const LEGACY_EMAIL = 'legacy@sync.tamanu';
const DEDICATED_EMAIL = 'sync.abc@sync.tamanu';

const makeArgs = ({ kind = USER_KINDS.USER, facts = {} } = {}) => {
  const factStore = new Map(
    Object.entries({
      [FACT_DEVICE_ID]: 'device-1',
      [FACT_FACILITY_IDS]: JSON.stringify(['facility-a']),
      [FACT_SYNC_EMAIL]: LEGACY_EMAIL,
      ...facts,
    }),
  );
  const secretStore = new Map([[FACT_SYNC_PASSWORD, 'legacy-password']]);
  const fetch = jest.fn();
  const setToken = jest.fn();
  return {
    args: {
      sequelize: { transaction: async callback => callback() },
      models: {
        LocalSystemFact: {
          get: jest.fn(async key => factStore.get(key) ?? null),
          set: jest.fn(async (key, value) => void factStore.set(key, value)),
        },
        LocalSystemSecret: {
          get: jest.fn(async key => secretStore.get(key) ?? null),
          set: jest.fn(async (key, value) => void secretStore.set(key, value)),
          setIfAbsent: jest.fn(async (key, value) => {
            if (!secretStore.has(key)) secretStore.set(key, value);
          }),
        },
      },
      centralServer: { user: kind === null ? null : { kind }, fetch, setToken },
    },
    factStore,
    secretStore,
    fetch,
    setToken,
  };
};

describe('convergeSyncUser', () => {
  it('swaps the config credentials for a dedicated sync user', async () => {
    const { args, factStore, secretStore, fetch, setToken } = makeArgs();
    fetch.mockResolvedValue({ email: DEDICATED_EMAIL, password: 'minted' });

    await convergeSyncUser(args);

    expect(fetch).toHaveBeenCalledWith('admin/syncCredentials', {
      method: 'POST',
      body: { deviceId: 'device-1', facilityIds: ['facility-a'] },
    });
    expect(factStore.get(FACT_SYNC_EMAIL)).toBe(DEDICATED_EMAIL);
    expect(secretStore.get(FACT_SYNC_PASSWORD)).toBe('minted');
    // the cached holder has to be refreshed or the next login uses the old credentials
    expect(getSyncConfig()).toMatchObject({ email: DEDICATED_EMAIL, password: 'minted' });
    // and the current token still belongs to the user we just replaced
    expect(setToken).toHaveBeenCalledWith('');
  });

  // Storing it here would satisfy pullSettingsPsk's absence check, so it would skip,
  // and with it the cache drop a running process needs to stop using a stale key.
  it('leaves the settings PSK in the response alone', async () => {
    const { args, secretStore, fetch } = makeArgs();
    fetch.mockResolvedValue({
      email: DEDICATED_EMAIL,
      password: 'minted',
      settingsPsk: 'ab'.repeat(32),
    });

    await convergeSyncUser(args);

    expect(secretStore.has(FACT_SETTINGS_PSK)).toBe(false);
  });

  it('does nothing once the sync user is dedicated', async () => {
    const { args, factStore, fetch, setToken } = makeArgs({ kind: USER_KINDS.SYNC });

    await convergeSyncUser(args);

    expect(fetch).not.toHaveBeenCalled();
    expect(setToken).not.toHaveBeenCalled();
    expect(factStore.get(FACT_SYNC_EMAIL)).toBe(LEGACY_EMAIL);
  });

  it('does nothing when the kind is unknown, rather than rotating the password', async () => {
    const { args, secretStore, fetch } = makeArgs({ kind: null });

    await convergeSyncUser(args);

    expect(fetch).not.toHaveBeenCalled();
    expect(secretStore.get(FACT_SYNC_PASSWORD)).toBe('legacy-password');
  });

  it('skips a server that never registered with central', async () => {
    const { args, fetch } = makeArgs({ facts: { [FACT_FACILITY_IDS]: JSON.stringify([]) } });

    await convergeSyncUser(args);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('propagates a failed provision for the caller to swallow', async () => {
    const { args, factStore, fetch, setToken } = makeArgs();
    fetch.mockRejectedValue(new Error('central refused'));

    await expect(convergeSyncUser(args)).rejects.toThrow('central refused');
    // still on the credentials the record step wrote, so sync keeps working
    expect(factStore.get(FACT_SYNC_EMAIL)).toBe(LEGACY_EMAIL);
    expect(setToken).not.toHaveBeenCalled();
  });
});
