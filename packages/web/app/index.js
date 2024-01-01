import { createRoot } from 'react-dom/client';
import { persistStore } from 'redux-persist';

import { renderRootInto } from './Root';
import { API } from './api/singletons';
import { registerYup } from './utils/errorMessages';
import { initStore, restoreSession, authFailure, versionIncompatible } from './store';

import '@fortawesome/fontawesome-free/css/all.css';
import 'react-toastify/dist/ReactToastify.css';
import './fonts.css';

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

  const container = document.getElementById('root');

  const root = createRoot(container); // createRoot(container!) if you use TypeScript
  renderRootInto(root, {
    api: API,
    persistor,
    store,
    history,
  });
}

start();
