import { AsyncStorage } from 'react-native';
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

/*eslint-disable */

console.disableYellowBox = true;

const reactotron = Reactotron

reactotron.setAsyncStorageHandler!(AsyncStorage);
reactotron.configure({
  name: 'Tamanu Mobile',
});

reactotron.useReactNative({
  asyncStorage: { ignore: ['secret'] },
});

reactotron.use(reactotronRedux());

if (__DEV__) {
  reactotron.connect!();
  reactotron.clear!();
}  


// @ts-ignore
reactotron.onCustomCommand('test', () => console.tron.log('This is an example'));
// @ts-ignore
console.tron = reactotron;

export default reactotron