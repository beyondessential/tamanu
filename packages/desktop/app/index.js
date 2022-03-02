import React from 'react';
import { render } from 'react-dom';
import { applyMiddleware, createStore, compose } from 'redux';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { routerMiddleware } from 'connected-react-router';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';

import Root from './Root';
import './fonts.scss';

import { createReducers } from './createReducers';
import { API } from './api/singletons';
import { startDataChangeResponder } from './DataChangeResponder';

import { registerYup } from './utils/errorMessages';

import { restoreSession, authFailure, versionIncompatible } from './store/auth';

function initStore(api) {
  const history = createHashHistory();
  const router = routerMiddleware(history);
  const enhancers = compose(applyMiddleware(router, thunk.withExtraArgument({ api })));
  const persistConfig = { key: 'tamanu', storage };
  if (process.env.NODE_ENV !== 'development') {
    persistConfig.whitelist = []; // persist used for a dev experience, but not required in production
  }
  const persistedReducers = persistCombineReducers(persistConfig, createReducers(history));
  const store = createStore(persistedReducers, {}, enhancers);
  return { store, history };
}

function initPersistor(api, store) {
  const persistor = persistStore(store, null, () => {
    const { auth } = store.getState();
    api.setToken(auth.token);
  });

  // if you run into problems with redux state, call "purge()" in the dev console
  if (window.localStorage.getItem('queuePurge')) {
    persistor.purge();
    window.localStorage.setItem('queuePurge', '');
  }

  window.purge = () => {
    window.localStorage.setItem('queuePurge', 'true');
    window.location.reload();
  };

  return persistor;
}

function start() {
  registerYup();

  // TODO: Switch to use api when we get rid of API singleton
  // const api = new TamanuApi(version);
  const { store, history } = initStore(API);

  // set up data change responder to trigger reloads when relevant data changes server-side
  startDataChangeResponder(API, store);

  // attempt to restore session from local storage
  store.dispatch(restoreSession());

  API.setAuthFailureHandler(() => {
    store.dispatch(authFailure());
  });

  API.setVersionIncompatibleHandler((isTooLow, minVersion, maxVersion) => {
    store.dispatch(versionIncompatible(isTooLow, minVersion, maxVersion));
  });

  const persistor = initPersistor(API, store);

  render(
    <Root api={API} persistor={persistor} store={store} history={history} />,
    document.getElementById('root'),
  );
}

start();
