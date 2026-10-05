import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import Reactotron from '../reactotron';
import { authReducer } from './ducks/auth';
import { patientReducer } from './ducks/patient';
import { secureStorage } from './secureStorage';

/*eslint-disable @typescript-eslint/no-non-null-assertion*/

const authPersistConfig = {
  key: 'auth',
  storage: secureStorage,
};

const rootPersistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['auth'],
};

const rootReducer = combineReducers({
  patient: patientReducer,
  auth: persistReducer(authPersistConfig, authReducer),
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = createStore(persistedReducer, compose(Reactotron.createEnhancer!()));
export const persistor = persistStore(store);
