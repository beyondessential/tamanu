import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from 'styled-components';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme';
import { EncounterProvider } from './contexts/Encounter';

export default function Root({ store, history }) {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <StylesProvider injectFirst>
          <MuiThemeProvider theme={theme}>
            <ThemeProvider theme={theme}>
              <EncounterProvider>
                <CssBaseline />
                <RoutingApp />
              </EncounterProvider>
            </ThemeProvider>
          </MuiThemeProvider>
        </StylesProvider>
      </ConnectedRouter>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
};
