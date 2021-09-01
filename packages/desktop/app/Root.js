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
import { LabRequestProvider } from './contexts/LabRequest';
import { LocalisationProvider } from './contexts/Localisation';
import { ReferralProvider } from './contexts/Referral';
import { ElectronProvider } from './contexts/ElectronProvider';

const StateContextProviders = ({ children, store }) => (
  <EncounterProvider store={store}>
    <ReferralProvider>
      <LabRequestProvider store={store}>
        <LocalisationProvider store={store}>
          {children}
        </LocalisationProvider>
      </LabRequestProvider>
    </ReferralProvider>
  </EncounterProvider>
);

export default function Root({ store, history }) {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <StateContextProviders store={store}>
          <StylesProvider injectFirst>
            <MuiThemeProvider theme={theme}>
              <ThemeProvider theme={theme}>
                <ElectronProvider>
                  <CssBaseline />
                  <RoutingApp />
                </ElectronProvider>
              </ThemeProvider>
            </MuiThemeProvider>
          </StylesProvider>
        </StateContextProviders>
      </ConnectedRouter>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
};
