import * as Keychain from 'react-native-keychain';
import type { StringStorage } from './storedState';

const SERVICE_PREFIX = 'tamanu-persist';

/**
 * String storage backed by the platform secure store
 * (iOS Keychain / Android EncryptedSharedPreferences via react-native-keychain).
 */
export const secureStorage: StringStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${SERVICE_PREFIX}.${key}`,
      });

      if (!credentials) {
        return null;
      }

      return credentials.password;
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword(key, value, {
      service: `${SERVICE_PREFIX}.${key}`,
    });
  },
};
