import './__mocks__/IconsMock';
import './__mocks__/react-native-gesture-handlerMock';
import './__mocks__/TouchableOpacity.tsx';
import 'reflect-metadata';
import { YellowBox } from 'react-native';

jest.useFakeTimers();

YellowBox.ignoreWarnings([
  'Expected style', // Expected style "fontSize: 26" to contain units
]);
