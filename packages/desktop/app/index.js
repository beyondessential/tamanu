import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { persistReducer } from 'redux-persist';
import BackboneSync from './utils/backbone-sync';
import Root from './containers/Root';
import {
  store,
  persistor,
  persistConfig,
  history,
} from './store';
import './styles/app.global.scss';

(async () => {
  BackboneSync(store);

  render(
    <AppContainer>
      <Root
        persistor={persistor}
        store={store}
        history={history}
      />
    </AppContainer>,
    document.getElementById('root'),
  );

  if (module.hot) {
    module.hot.accept('./containers/Root', () => {
      store.replaceReducer(
        persistReducer(persistConfig, NextRoot),
      );
      render(
        <AppContainer>
          <Root
            store={store}
            history={history}
          />
        </AppContainer>,
        document.getElementById('root'),
      );
    });
  }
})();
