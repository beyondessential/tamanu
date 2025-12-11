import { compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Reactotron from '../reactotron';
import rootReducer from './ducks';

/*eslint-disable @typescript-eslint/no-non-null-assertion*/

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, compose(Reactotron.createEnhancer!()));
export const persistor = persistStore(store);
