import AsyncStorage from '@react-native-community/async-storage';

export function clear() {
  console.log('Clearing config');
  return AsyncStorage.clear();
}

export async function readConfig(key: string, defaultValue: string): string {
  try {
    const value = await AsyncStorage.getItem(key)
    return (value !== null) ? value : defaultValue;
  } catch(e) {
    console.warn(e);
    return defaultValue;
  }
}

export async function writeConfig(key: string, value: string): void {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    // saving error
    console.warn(e);
  }
}
