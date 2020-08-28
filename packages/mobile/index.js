import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import { env } from './env';
import Storybook from './storybook';
import { App } from './App';
import 'react-native-gesture-handler';

// eslint-disable-next-line no-console
console.disableYellowBox = true;

AppRegistry.registerComponent(appName, () => (env.STORYBOOK === 'true' ? Storybook : App));
