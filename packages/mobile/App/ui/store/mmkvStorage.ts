import { MMKVLoader } from 'react-native-mmkv-storage';

// MMKV instance with built-in redux-persist support (setItem, getItem, removeItem)
export const mmkvStorage = new MMKVLoader()
  .withInstanceID('tamanu-storage')
  .withEncryption()
  .initialize();