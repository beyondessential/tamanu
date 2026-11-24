import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, compose, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import Reactotron from '../reactotron';
import { patientReducer } from './ducks/patient';

/*eslint-disable @typescript-eslint/no-non-null-assertion*/

const rootPersistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const rootReducer = combineReducers({
  patient: patientReducer,
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = createStore(persistedReducer, compose(Reactotron.createEnhancer!()));
export const persistor = persistStore(store);
