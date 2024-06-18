import { compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';
import rootReducer from './ducks';

const storage = createSensitiveStorage({
  keychainService: 'ios-data',
  sharedPreferencesName: 'android-data',
});

/*eslint-disable @typescript-eslint/no-non-null-assertion*/

const persistConfig = {
  key: 'root',
  storage,
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(
  persistedReducer,
);
export const persistor = persistStore(store);
