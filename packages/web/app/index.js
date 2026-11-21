import { createRoot } from 'react-dom/client';
import { persistStore } from 'redux-persist';

import { renderRootInto } from './Root';
import { API } from './api/singletons';
import { initWebTelemetry } from './telemetry';
import { registerYup } from './utils/errorMessages';
import { authFailure, initStore, restoreSession, versionIncompatible } from './store';
import { systemErrorStore } from './state/systemErrorStore';

import '@fortawesome/fontawesome-free/css/all.css';
import './fonts.css';

function initPersistor(api, store) {
  const persistor = persistStore(store, null, () => {
    const { auth } = store.getState();
    if (auth.token) {
      void api.setToken(auth.token).catch(err => {
        console.error('[Tamanu] Failed to persist auth token after rehydration', err);
      });
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

  // spec: BTEL — start browser performance telemetry (collects from before sign-in).
  initWebTelemetry(API);

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

  API.setSystemErrorHandler(error => {
    systemErrorStore.add(error);
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
