import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConnectedRouter } from 'connected-react-router';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from 'styled-components';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { Slide, ToastContainer } from 'react-toastify';
import { ApiContext } from './api';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme';
import { EncounterProvider } from './contexts/Encounter';
import { LabRequestProvider } from './contexts/LabRequest';
import { LocalisationProvider } from './contexts/Localisation';
import { ReferralProvider } from './contexts/Referral';
import { ImagingRequestsProvider } from './contexts/ImagingRequests';
import { PatientSearchProvider } from './contexts/PatientSearch';
import { EncounterNotesProvider } from './contexts/EncounterNotes';

const StateContextProviders = ({ children, store }) => (
  <EncounterProvider store={store}>
    <ReferralProvider>
      <ImagingRequestsProvider>
        <EncounterNotesProvider>
          <LabRequestProvider store={store}>
            <PatientSearchProvider>
              <LocalisationProvider store={store}>{children}</LocalisationProvider>
            </PatientSearchProvider>
          </LabRequestProvider>
        </EncounterNotesProvider>
      </ImagingRequestsProvider>
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
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ApiContext.Provider value={api}>
          <ConnectedRouter history={history}>
            <StylesProvider injectFirst>
              <MuiThemeProvider theme={theme}>
                <ThemeProvider theme={theme}>
                  <StateContextProviders store={store}>
                    <ReactQueryDevtools initialIsOpen={false} />
                    <ToastContainer
                      hideProgressBar
                      transition={Slide}
                      closeOnClick
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme="colored"
                      icon={false}
                      limit={5}
                    />
                    <CssBaseline />
                    <RoutingApp />
                  </StateContextProviders>
                </ThemeProvider>
              </MuiThemeProvider>
            </StylesProvider>
          </ConnectedRouter>
        </ApiContext.Provider>
      </Provider>
    </QueryClientProvider>
  );
}

Root.propTypes = {
  store: PropTypes.instanceOf(Object).isRequired,
  history: PropTypes.instanceOf(Object).isRequired,
};
