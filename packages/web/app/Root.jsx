import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConnectedRouter } from 'connected-react-router';
import PropTypes from 'prop-types';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from 'styled-components';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import MuiLatestThemeProvider from '@mui/material/styles/ThemeProvider';
import { LocalizationProvider as MuiLocalisationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Slide } from 'react-toastify';
import { ApiContext } from './api';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme';
import { GlobalStyles } from './constants';
import { EncounterProvider } from './contexts/Encounter';
import { LabRequestProvider } from './contexts/LabRequest';
import { ImagingRequestsProvider } from './contexts/ImagingRequests';
import { PatientSearchProvider } from './contexts/PatientSearch';
import { EncounterNotesProvider } from './contexts/EncounterNotes';
import { SyncStateProvider } from './contexts/SyncState';
import { ProgramRegistryProvider } from './contexts/ProgramRegistry';
import { TranslationProvider } from './contexts/Translation';
import { LocalisationProvider } from './contexts/Localisation';
import { SettingsProvider } from './contexts/Settings';
import { CustomToastContainer } from './customToastContainer';
import { ClearIcon } from './components/Icons/ClearIcon';
import { NoteModalProvider } from './contexts/NoteModal';

const StateContextProviders = ({ children, store }) => (
  <EncounterProvider store={store}>
    <ImagingRequestsProvider>
      <EncounterNotesProvider>
        <ProgramRegistryProvider>
          <LabRequestProvider store={store}>
            <PatientSearchProvider>
              <SettingsProvider>
                <SyncStateProvider>
                  <TranslationProvider>
                    <LocalisationProvider store={store}>
                      <NoteModalProvider>{children}</NoteModalProvider>
                    </LocalisationProvider>
                  </TranslationProvider>
                </SyncStateProvider>
              </SettingsProvider>
            </PatientSearchProvider>
          </LabRequestProvider>
        </ProgramRegistryProvider>
      </EncounterNotesProvider>
    </ImagingRequestsProvider>
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
              <MuiLatestThemeProvider theme={theme}>
                <MuiThemeProvider theme={theme}>
                  <ThemeProvider theme={theme}>
                    <MuiLocalisationProvider dateAdapter={AdapterDateFns}>
                      <StateContextProviders store={store}>
                        <ReactQueryDevtools initialIsOpen={false} />
                        <GlobalStyles />
                        <CustomToastContainer
                          hideProgressBar
                          transition={Slide}
                          closeOnClick
                          pauseOnFocusLoss
                          draggable
                          pauseOnHover
                          theme="colored"
                          icon={false}
                          limit={5}
                          closeButton={<ClearIcon />}
                        />
                        <CssBaseline />
                        <RoutingApp />
                      </StateContextProviders>
                    </MuiLocalisationProvider>
                  </ThemeProvider>
                </MuiThemeProvider>
              </MuiLatestThemeProvider>
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
