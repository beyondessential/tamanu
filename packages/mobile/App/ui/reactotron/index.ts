import AsyncStorage from '@react-native-async-storage/async-storage';
import Reactotron from 'reactotron-react-native';

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

if (__DEV__) {
  reactotron.connect!();
  reactotron.clear!();
}  


// @ts-ignore
reactotron.onCustomCommand('test', () => console.tron.log('This is an example'));
// @ts-ignore
console.tron = reactotron;

export default reactotron