// No crypto.settingsPsk in config, so getConfigSecret throws SecretNotConfigured
// and the generate path (rather than the legacy config-seed path) is exercised.
jest.mock('config', () => ({
  __esModule: true,
  default: { get: () => undefined },
}));

import { FACT_SETTINGS_PSK } from '@tamanu/constants';
import {
  setSettingsPskSource,
  getSettingsPskKeyBuffer,
  ensureSettingsPsk,
} from '../../src/utils/crypto';

const HEX = 'ab'.repeat(32); // 64 hex chars = 32 bytes

afterEach(() => {
  setSettingsPskSource(null);
});

describe('getSettingsPskKeyBuffer', () => {
  it('reads the PSK from the registered source', async () => {
    setSettingsPskSource(async () => HEX);
    const buffer = await getSettingsPskKeyBuffer();
    expect(buffer).toEqual(Buffer.from(HEX, 'hex'));
  });

  it('re-registering the source replaces the cached value', async () => {
    setSettingsPskSource(async () => HEX);
    await getSettingsPskKeyBuffer();

    const other = 'cd'.repeat(32);
    setSettingsPskSource(async () => other);
    expect(await getSettingsPskKeyBuffer()).toEqual(Buffer.from(other, 'hex'));
  });

  // Buffer.from(x, 'hex') silently drops bad chars, so a corrupt/empty PSK must be
  // rejected here rather than surfacing later as an opaque "Decryption failed".
  it.each([
    ['an empty string', ''],
    ['a non-hex string', 'not-a-valid-hex-psk'],
    ['a too-short hex string', 'abcd'],
    ['odd-length hex', 'a'.repeat(63)],
  ])('rejects %s with a clear error instead of a silent bad key', async (_label, badPsk) => {
    setSettingsPskSource(async () => badPsk);
    await expect(getSettingsPskKeyBuffer()).rejects.toThrow(/Settings PSK must be exactly 64 hex/);
  });
});

describe('ensureSettingsPsk', () => {
  it('generates and stores a 64-hex PSK when none exists', async () => {
    const store = { get: jest.fn().mockResolvedValue(null), setIfAbsent: jest.fn() };
    await ensureSettingsPsk(store);

    expect(store.setIfAbsent).toHaveBeenCalledTimes(1);
    const [key, value] = store.setIfAbsent.mock.calls[0];
    expect(key).toBe(FACT_SETTINGS_PSK);
    expect(value).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is a no-op when a PSK already exists', async () => {
    const store = { get: jest.fn().mockResolvedValue(HEX), setIfAbsent: jest.fn() };
    await ensureSettingsPsk(store);
    expect(store.setIfAbsent).not.toHaveBeenCalled();
  });
});
