import { createHashHistory } from 'history';
import { createReduxHistoryContext } from 'redux-first-history';
import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import storage from 'redux-persist/lib/storage';
import { persistCombineReducers } from 'redux-persist';

import { authReducer } from './auth';
import { imagingRequestReducer } from './imagingRequest';
import { patientReducer } from './patient';
import { specialModalsReducer } from './specialModals';
import { IS_DEVELOPMENT } from '../utils/env';

const hashHistory = createHashHistory();
const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({ history: hashHistory });

export const createReducers = () => ({
  router: routerReducer,
  auth: authReducer,
  patient: patientReducer,
  imagingRequest: imagingRequestReducer,
  specialModals: specialModalsReducer,
});

export function initStore(api, initialState = {}) {
  const enhancers = compose(applyMiddleware(routerMiddleware, thunk.withExtraArgument({ api })));
  const persistConfig = { key: 'tamanu', storage };
  if (!IS_DEVELOPMENT) {
    persistConfig.whitelist = []; // persist used for a dev experience, but not required in production
  }
  const persistedReducers = persistCombineReducers(persistConfig, createReducers());
  const store = createStore(persistedReducers, initialState, enhancers);
  const history = createReduxHistory(store);

  return { store, history };
}
