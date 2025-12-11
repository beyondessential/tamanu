import './__mocks__/IconsMock';
import './__mocks__/react-native-gesture-handlerMock';
import './__mocks__/TouchableOpacity.tsx';
import './__mocks__/react-native__Libraries__Utilities__DevSettings';
import './__mocks__/react-native-device-infoMock';
import './__mocks__/react-native-nitro-sqlite';

import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { LogBox } from 'react-native';

jest.useFakeTimers();

LogBox.ignoreLogs([
  'Expected style',
]);

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
