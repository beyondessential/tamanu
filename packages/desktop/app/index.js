import React from 'react';
import { render } from 'react-dom';
import { persistStore } from 'redux-persist';

import Root from './Root';
import { API } from './api/singletons';
import { registerYup } from './utils/errorMessages';
import { initStore, restoreSession, authFailure, versionIncompatible } from './store';

import './fonts.scss';
import './react-toastify.scss';

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

// Add this work around for webpack hot module reloading. We should be able to remove it if we update
// our webpack version to a version higher than 5.40 @see https://github.com/webpack-contrib/webpack-hot-middleware/issues/390
if (process.env.NODE_ENV === 'development') {
  if (module.hot) {
    module.hot.accept();
  }
}
