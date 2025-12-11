import RNSensitiveInfo from 'react-native-sensitive-info';

const OPTIONS = {
  sharedPreferencesName: 'tamanu_prefs',
  keychainService: 'tamanu',
  kSecAttrAccessible: 'kSecAttrAccessibleAfterFirstUnlock',
};

export const sensitiveStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const result = await RNSensitiveInfo.getItem(key, OPTIONS);
      return result || null;
    } catch (error) {
      console.error('Error getting sensitive data:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await RNSensitiveInfo.setItem(key, value, OPTIONS);
    } catch (error) {
      console.error('Error storing sensitive data:', error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await RNSensitiveInfo.deleteItem(key, OPTIONS);
    } catch (error) {
      console.error('Error removing sensitive data:', error);
    }
  },
};

