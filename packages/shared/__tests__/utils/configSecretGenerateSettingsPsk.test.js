import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// getConfigKeyFilePath reads config.crypto.keyFile; point it at a temp key file
// so the action can encrypt against a real key. Path is recomputed (not captured)
// because jest.mock factories can't reference out-of-scope variables.
const keyFilePath = () => path.join(os.tmpdir(), 'tamanu-test-config-key-settings-psk');
jest.mock('config', () => {
  const osMod = require('node:os');
  const pathMod = require('node:path');
  const file = pathMod.join(osMod.tmpdir(), 'tamanu-test-config-key-settings-psk');
  return {
    __esModule: true,
    default: { get: key => (key === 'crypto.keyFile' ? file : undefined) },
  };
});

import {
  generateSecretKey,
  writeKeyFile,
  decryptSecret,
  isEncryptedSecret,
  configSecretGenerateSettingsPskAction,
} from '../../src/utils/crypto';

const run = async () => {
  let out = '';
  await configSecretGenerateSettingsPskAction({ write: chunk => (out += chunk) });
  return out.trim();
};

describe('configSecretGenerateSettingsPskAction', () => {
  let keyBuffer;

  beforeAll(async () => {
    keyBuffer = await generateSecretKey();
    await writeKeyFile(keyFilePath(), keyBuffer);
  });
  afterAll(() => {
    try {
      fs.unlinkSync(keyFilePath());
    } catch {
      // already gone
    }
  });

  it('prints an encrypted PSK that decrypts to a 32-byte (64 hex char) key', async () => {
    const encrypted = await run();
    expect(isEncryptedSecret(encrypted)).toBe(true);
    const psk = await decryptSecret(keyBuffer, encrypted);
    expect(psk).toMatch(/^[0-9a-f]{64}$/);
    expect(Buffer.from(psk, 'hex')).toHaveLength(32);
  });

  it('generates a fresh PSK on each call', async () => {
    const first = await decryptSecret(keyBuffer, await run());
    const second = await decryptSecret(keyBuffer, await run());
    expect(first).not.toBe(second);
  });
});
