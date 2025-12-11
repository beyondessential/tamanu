import { compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import Reactotron from '../reactotron';
import rootReducer from './ducks';
import { mmkvStorage } from './mmkvStorage';

/*eslint-disable @typescript-eslint/no-non-null-assertion*/

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, compose(Reactotron.createEnhancer()));
export const persistor = persistStore(store);
