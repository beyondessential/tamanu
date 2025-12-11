import { compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';
import Reactotron from '../reactotron';
import rootReducer from './ducks';

const storage = createSensitiveStorage({
  keychainService: 'ios-data',
  sharedPreferencesName: 'android-data',
  accessible: 'WHEN_UNLOCKED',
  kSecAttrAccessible: 'kSecAttrAccessibleAfterFirstUnlock',
  touchID: false,
});

/*eslint-disable @typescript-eslint/no-non-null-assertion*/

const persistConfig = {
  key: 'root',
  storage,
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, compose(Reactotron.createEnhancer!()));
export const persistor = persistStore(store);
