import { ReadSettings } from '@tamanu/settings';
import {
  decryptSecret,
  getSettingsPskKeyBuffer,
  isEncryptedSecret,
  SecretNotConfiguredError,
} from './crypto';

/**
 * Adds getSecret method to ReadSettings prototype.
 * Call this once at application startup.
 */
export function patchReadSettings() {
  ReadSettings.prototype.getSecret = async function (name) {
    const encryptedValue = await this.get(name);
    if (!encryptedValue || typeof encryptedValue !== 'string') {
      throw new SecretNotConfiguredError(`Secret setting not found: ${name}`);
    }
    if (!isEncryptedSecret(encryptedValue)) {
      throw new Error(
        `Setting at ${name} is not encrypted; re-save it via the admin UI to encrypt it`,
      );
    }

    const keyBuffer = await getSettingsPskKeyBuffer();
    return decryptSecret(keyBuffer, encryptedValue);
  };
}
