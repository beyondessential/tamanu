import './__mocks__/IconsMock';
import './__mocks__/react-native-gesture-handlerMock';
import './__mocks__/TouchableOpacity.tsx';
import './__mocks__/react-native__Libraries__Utilities__DevSettings';
import 'reflect-metadata';
import { YellowBox } from 'react-native';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.useFakeTimers();

YellowBox.ignoreWarnings([
  'Expected style', // Expected style "fontSize: 26" to contain units
]);

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
