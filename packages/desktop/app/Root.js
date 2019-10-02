import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import { StylesProvider } from '@material-ui/styles';
import { RoutingApp } from './RoutingApp';
import { initClient } from './utils';
import { Preloader, ThemeProvider } from './components';

export default function Root({ store, history, persistor }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<Preloader />} persistor={persistor} onBeforeLift={initClient()}>
        <ConnectedRouter history={history}>
          <StylesProvider injectFirst>
            <ThemeProvider>
              <CssBaseline />
              <RoutingApp />
            </ThemeProvider>
          </StylesProvider>
        </ConnectedRouter>
      </PersistGate>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
  persistor: PropTypes.instanceOf(Object).isRequired,
};
