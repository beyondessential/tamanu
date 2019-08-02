import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { applyMiddleware, createStore, compose } from 'redux';
import { persistStore, persistCombineReducers } from 'redux-persist';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';

import Root from './containers/Root';
import './styles/app.global.scss';

import { TamanuApi } from './TamanuApi';
import { reducers } from './reducers';

const history = createHashHistory();
const router = routerMiddleware(history);
const api = new TamanuApi(process.env.HOST);
const enhancers = compose(applyMiddleware(router, thunk.withExtraArgument({ api })));
const persistedReducers = persistCombineReducers({ key: 'tamanu' }, reducers);
const store = createStore(persistedReducers, { key: 'tamanu' }, enhancers);
const persistedStore = persistStore(store);
// persistedStore.purge(); // Uncomment this to wipe bad redux state during development

api.injectReduxStore(store);

render(
  <AppContainer>
    <Root persistedStore={persistedStore} store={store} history={history} />
  </AppContainer>,
  document.getElementById('root'),
);
