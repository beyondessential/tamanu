import { AsyncStorage } from 'react-native';
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

/*eslint-disable */

console.disableYellowBox = true;

const reactotron = Reactotron

reactotron.setAsyncStorageHandler!(AsyncStorage);
reactotron.configure({
  name: 'Demo App',
});

reactotron.useReactNative({
  asyncStorage: { ignore: ['secret'] },
});

reactotron.use(reactotronRedux());

if (__DEV__) {
  reactotron.connect!();
  reactotron.clear!();
}  


reactotron.onCustomCommand('test', () => console.tron.log('This is an example'));

console.tron = reactotron;

export default reactotron
