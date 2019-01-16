import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { persistReducer } from 'redux-persist';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import BackboneSync from './utils/backbone-sync';
import './styles/app.global.scss';

(async () => {
  const {
    store,
    persistor,
    persistConfig
  } = configureStore();
  BackboneSync(store);

  render(
    <AppContainer>
      <Root
        persistor={persistor}
        store={store}
        history={history}
      />
    </AppContainer>,
    document.getElementById('root')
  );

  if (module.hot) {
    module.hot.accept('./containers/Root', () => {
      const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
      store.replaceReducer(
        persistReducer(persistConfig, NextRoot)
      )
      render(
        <AppContainer>
          <NextRoot
            store={store}
            history={history}
          />
        </AppContainer>,
        document.getElementById('root')
      );
    });
  }
})();
