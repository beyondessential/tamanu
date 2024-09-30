import { createRoot } from 'react-dom/client';
import { persistStore } from 'redux-persist';

import { renderRootInto } from './Root';
import { API } from './api/singletons';
import { registerYup } from './utils/errorMessages';
import { authFailure, initStore, restoreSession, versionIncompatible } from './store';

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

  if (window.env.BUGSNAG_API_KEY) {
    // We do not await this import because we don't want to block the app from starting if it fails,
    // such as when a Facility server is operating in a network without internet access. Of course,
    // that means we won't be able to catch early errors in Bugsnag, but we can live with that.
    import('https://d2wy8f7a9ursnm.cloudfront.net/v1/bugsnag-performance.min.js')
      .then(({ default: BugsnagPerformance }) => {
        BugsnagPerformance.start({ apiKey: window.env.BUGSNAG_API_KEY });
      });
  }

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
