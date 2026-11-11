import 'reflect-metadata';
import './__mocks__/IconsMock';
import './__mocks__/react-native-gesture-handlerMock';
import './__mocks__/TouchableOpacity.tsx';
import './__mocks__/react-native__Libraries__Utilities__DevSettings';
import './__mocks__/react-native-device-infoMock';
import './__mocks__/react-native-nitro-sqlite';

import { LogBox } from 'react-native';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest';
import mockNetInfo from '@react-native-community/netinfo/jest/netinfo-mock';

jest.useFakeTimers();

LogBox.ignoreLogs([
  'Expected style', // Expected style "fontSize: 26" to contain units
]);

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// reports the device as online; the sync manager checks this before starting a sync
jest.mock('@react-native-community/netinfo', () => mockNetInfo);

// the package ships untranspiled ESM and resolves its native module on import, so it can't load
// under jest. It is imported by the sync manager, which most suites pull in through the models
jest.mock('@sayem314/react-native-keep-awake', () => ({
  activateKeepAwake: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve()),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve()),
}));
