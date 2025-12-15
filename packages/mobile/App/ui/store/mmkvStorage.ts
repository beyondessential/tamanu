import { MMKVLoader } from 'react-native-mmkv-storage';

export const mmkvStorage = new MMKVLoader()
  .withInstanceID('tamanu-storage')
  .withEncryption()
  .initialize();
  