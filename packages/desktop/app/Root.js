import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from 'styled-components';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { RoutingApp } from './RoutingApp';
import { initClient } from './utils';
import { Preloader } from './components';
import { theme } from './theme';

export default function Root({ store, history, persistor }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<Preloader />} persistor={persistor} onBeforeLift={initClient()}>
        <ConnectedRouter history={history}>
          <StylesProvider injectFirst>
            <MuiThemeProvider theme={theme}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <RoutingApp />
              </ThemeProvider>
            </MuiThemeProvider>
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
