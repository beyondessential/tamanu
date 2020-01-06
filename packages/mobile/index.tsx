import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { env } from './env';
import Storybook from './storybook';
import 'react-native-gesture-handler';

//console.disableYellowBox = true;

AppRegistry.registerComponent(appName, () => Storybook);
