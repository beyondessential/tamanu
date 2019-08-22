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

const history = createHashHistory();
const router = routerMiddleware(history);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line no-underscore-dangle
const enhancers = composeEnhancers(applyMiddleware(router, thunk.withExtraArgument({ api: API })));
const persistedReducers = persistCombineReducers(
  { key: 'tamanu', storage },
  createReducers(history),
);
const store = createStore(persistedReducers, {}, enhancers);
const persistor = persistStore(store);

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
