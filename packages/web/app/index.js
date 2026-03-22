import { createRoot } from 'react-dom/client';
import { persistStore } from 'redux-persist';

import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';

import { renderRootInto } from './Root';
import { API } from './api/singletons';
import { registerYup } from './utils/errorMessages';
import { BUGSNAG_API_KEY, NODE_ENV, FULL_VERSION } from './utils/env';
import { authFailure, initStore, restoreSession, versionIncompatible } from './store';

import '@fortawesome/fontawesome-free/css/all.css';
import './fonts.css';

function initPersistor(api, store) {
  const persistor = persistStore(store, null, () => {
    const { auth } = store.getState();
    if (auth.token) {
      api.setToken(auth.token);
    }
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

async function start() {
  registerYup();

  if (BUGSNAG_API_KEY) {
    Bugsnag.start({
      apiKey: BUGSNAG_API_KEY,
      plugins: [new BugsnagPluginReact()],
      releaseStage: NODE_ENV,
      appVersion: FULL_VERSION,
    });
  }

  // TODO: Switch to use api when we get rid of API singleton
  // const api = new TamanuApi(version);
  const { store } = initStore(API);

  const persistor = initPersistor(API, store);

  // attempt to restore session from local storage
  await store.dispatch(restoreSession());

  API.setAuthFailureHandler(() => {
    store.dispatch(authFailure());
  });

  API.setVersionIncompatibleHandler((isTooLow, minVersion, maxVersion) => {
    store.dispatch(versionIncompatible(isTooLow, minVersion, maxVersion));
  });

  const container = document.getElementById('root');

  const root = createRoot(container); // createRoot(container!) if you use TypeScript
  renderRootInto(root, {
    api: API,
    persistor,
    store,
  });
}

start();
