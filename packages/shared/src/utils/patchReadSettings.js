import { ReadSettings } from '@tamanu/settings';
import { getConfigSecret, decryptSecret } from './crypto';

/**
 * Adds getSecret method to ReadSettings prototype.
 * Call this once at application startup.
 */
export function patchReadSettings() {
  ReadSettings.prototype.getSecret = async function (name) {
    const encryptedValue = await this.get(name);
    if (!encryptedValue || typeof encryptedValue !== 'string') {
      throw new Error(`Secret setting not found: ${name}`);
    }

    const psk = await getConfigSecret('crypto.settingsPsk');
    const keyBuffer = Buffer.from(psk, 'base64');
    return decryptSecret(keyBuffer, encryptedValue);
  };
}
