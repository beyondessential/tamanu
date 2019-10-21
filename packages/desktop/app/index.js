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
import { API } from './api';
import { startDataChangeResponder } from './DataChangeResponder';

const history = createHashHistory();
const router = routerMiddleware(history);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line no-underscore-dangle
const enhancers = composeEnhancers(applyMiddleware(router, thunk.withExtraArgument({ api: API })));
const persistConfig = { key: 'tamanu', storage };
if (process.env.NODE_ENV !== 'development') {
  persistConfig.whitelist = []; // persist used for a dev experience, but not required in production
}
const persistedReducers = persistCombineReducers(persistConfig, createReducers(history));
const store = createStore(persistedReducers, {}, enhancers);

// set up data change responder to trigger reloads when relevant data changes server-side
startDataChangeResponder(API, store);

const persistor = persistStore(store, null, () => {
  const { auth } = store.getState();
  API.setToken(auth.token);
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

render(
  <Root persistor={persistor} store={store} history={history} />,
  document.getElementById('root'),
);
