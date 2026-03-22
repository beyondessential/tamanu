import { AppRegistry, LogBox } from 'react-native';
import { name as appName } from './app.json';
import { Root } from './Root';
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import "@react-native-anywhere/polyfill-base64";

LogBox.ignoreLogs([
  'to contain units',
  'Setting a timer', // our usage of timers is appropriate, see #53
]);

AppRegistry.registerComponent(appName, () => Root);
