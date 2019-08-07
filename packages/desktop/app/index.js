import React from 'react';
import { render } from 'react-dom';
import { applyMiddleware, createStore, compose } from 'redux';
import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';

import Root from './containers/Root';
import './styles/app.global.scss';

import { reducers } from './reducers';
import { API } from './api';

const history = createHashHistory();
const router = routerMiddleware(history);
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line no-underscore-dangle
const enhancers = composeEnhancers(applyMiddleware(router, thunk.withExtraArgument({ api: API })));
const persistedReducers = persistCombineReducers({ key: 'tamanu', storage }, reducers);
const store = createStore(persistedReducers, {}, enhancers);
const persistor = persistStore(store);
// persistor.purge(); // Uncomment this to wipe bad redux state during development

API.injectReduxStore(store);

render(
  <Root persistor={persistor} store={store} history={history} />,
  document.getElementById('root'),
);
