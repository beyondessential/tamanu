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
import { ReferralProvider } from './contexts/Referral';
import { ImagingRequestsProvider } from './contexts/ImagingRequests';
import { PatientSearchProvider } from './contexts/PatientSearch';
import { EncounterNotesProvider } from './contexts/EncounterNotes';
import { SyncStateProvider } from './contexts/SyncState';
import { ProgramRegistryProvider } from './contexts/ProgramRegistry';
import { TranslationProvider } from './contexts/Translation';
import { LocalisationProvider } from './contexts/Localisation';

const StateContextProviders = ({ children, store }) => (
  <EncounterProvider store={store}>
    <ReferralProvider>
      <ImagingRequestsProvider>
        <EncounterNotesProvider>
          <ProgramRegistryProvider>
            <LabRequestProvider store={store}>
              <PatientSearchProvider>
                <SyncStateProvider>
                  <TranslationProvider>
                    <LocalisationProvider store={store}>{children}</LocalisationProvider>
                  </TranslationProvider>
                </SyncStateProvider>
              </PatientSearchProvider>
            </LabRequestProvider>
          </ProgramRegistryProvider>
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

function Root({ api, store, history }) {
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

export function renderRootInto(root, props) {
  root.render(<Root {...props} />);
}
