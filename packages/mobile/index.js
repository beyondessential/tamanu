import { AppRegistry, YellowBox } from 'react-native';
import { name as appName } from './app.json';
import { env } from './env';
import Storybook from './storybook';
import { App } from './App';
import 'react-native-gesture-handler';

YellowBox.ignoreWarnings(['to contain units']);

AppRegistry.registerComponent(appName, () => (env.STORYBOOK === 'true' ? Storybook : App));
