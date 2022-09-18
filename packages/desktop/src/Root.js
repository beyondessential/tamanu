import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConnectedRouter } from 'connected-react-router';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from 'styled-components';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { ToastContainer } from 'react-toastify';
import { ApiContext } from './api';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme';
import { EncounterProvider } from './contexts/Encounter';
import { LabRequestProvider } from './contexts/LabRequest';
import { LocalisationProvider } from './contexts/Localisation';
import { ReferralProvider } from './contexts/Referral';

const StateContextProviders = ({ children, store }) => (
  <EncounterProvider store={store}>
    <ReferralProvider>
      <LabRequestProvider store={store}>
        <LocalisationProvider store={store}>{children}</LocalisationProvider>
      </LabRequestProvider>
    </ReferralProvider>
  </EncounterProvider>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Root({ api, store, history }) {
  return (
    <Provider store={store}>
      <ApiContext.Provider value={api}>
        <ConnectedRouter history={history}>
          <StateContextProviders store={store}>
            <StylesProvider injectFirst>
              <MuiThemeProvider theme={theme}>
                <ThemeProvider theme={theme}>
                  <QueryClientProvider client={queryClient}>
                    <ReactQueryDevtools initialIsOpen={false} />
                    <ToastContainer
                      closeOnClick
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      limit={5}
                    />
                    <CssBaseline />
                    <RoutingApp />
                  </QueryClientProvider>
                </ThemeProvider>
              </MuiThemeProvider>
            </StylesProvider>
          </StateContextProviders>
        </ConnectedRouter>
      </ApiContext.Provider>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
};
