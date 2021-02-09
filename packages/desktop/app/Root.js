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
import { ReferralProvider } from './contexts/Referral';

export default function Root({ store, history }) {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <EncounterProvider store={store}>
          <ReferralProvider store={store}>
            <StylesProvider injectFirst>
              <MuiThemeProvider theme={theme}>
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <RoutingApp />
                </ThemeProvider>
              </MuiThemeProvider>
            </StylesProvider>
          </ReferralProvider>
        </EncounterProvider>
      </ConnectedRouter>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
};
