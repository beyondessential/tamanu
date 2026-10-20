import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import storage from 'redux-persist/lib/storage';
import { persistCombineReducers } from 'redux-persist';

import { authReducer } from './auth';
import { systemErrorStore } from '../state/systemErrorStore';
import { IS_DEVELOPMENT } from '../utils/env';

export const createReducers = () => ({
  auth: authReducer,
});

// System errors live outside redux (state/systemErrorStore.js) but stay session-scoped, so
// clear them on the same auth lifecycle actions the old slice keyed on. These string literals
// mirror auth.js (which doesn't export them), matching the previous reducer.
export const clearSystemErrorsOnAuthChange = () => next => action => {
  if (action.type === 'LOGIN_SUCCESS' || action.type === 'LOGOUT') {
    systemErrorStore.clear();
  }
  return next(action);
};

export function initStore(api, initialState = {}) {
  const enhancers = compose(
    applyMiddleware(thunk.withExtraArgument({ api }), clearSystemErrorsOnAuthChange),
  );
  const persistConfig = { key: 'tamanu', storage };
  if (!IS_DEVELOPMENT) {
    persistConfig.whitelist = []; // persist used for a dev experience, but not required in production
  }
  const persistedReducers = persistCombineReducers(persistConfig, createReducers());
  const store = createStore(persistedReducers, initialState, enhancers);
  return { store };
}
