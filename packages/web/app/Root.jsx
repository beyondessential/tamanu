import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from 'styled-components';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import MuiLatestThemeProvider from '@mui/material/styles/ThemeProvider';
import { LocalizationProvider as MuiLocalisationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Slide } from 'react-toastify';
import { ApiContext, CustomToastContainer, DateTimeProvider } from '@tamanu/ui-components';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme';
import { GlobalStyles } from './constants';
import { EncounterProvider } from './contexts/Encounter';
import { AuthProvider } from './contexts/Auth';
import { LabRequestProvider } from './contexts/LabRequest';
import { ImagingRequestsProvider } from './contexts/ImagingRequests';
import { PatientSearchProvider } from './contexts/PatientSearch';
import { EncounterNotesProvider } from './contexts/EncounterNotes';
import { SyncStateProvider } from './contexts/SyncState';
import { ProgramRegistryProvider } from './contexts/ProgramRegistry';
import { TranslationProvider } from './contexts/Translation';
import { LocalisationProvider } from './contexts/Localisation';
import { SettingsProvider } from './contexts/Settings';
import { ClearIcon } from './components/Icons/ClearIcon';
import { NoteModalProvider } from './contexts/NoteModal';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { MedicationsProvider } from './contexts/Medications';

const StateContextProviders = ({ children, store }) => (
  <EncounterNotesProvider>
    <AuthProvider>
      <SettingsProvider>
        <DateTimeProvider>
          <EncounterProvider store={store}>
            <ImagingRequestsProvider>
              <MedicationsProvider>
                <ProgramRegistryProvider>
                  <LabRequestProvider store={store}>
                    <PatientSearchProvider>
                      <SyncStateProvider>
                        <TranslationProvider>
                          <LocalisationProvider store={store}>
                            <NoteModalProvider>{children}</NoteModalProvider>
                          </LocalisationProvider>
                        </TranslationProvider>
                      </SyncStateProvider>
                    </PatientSearchProvider>
                  </LabRequestProvider>
                </ProgramRegistryProvider>
              </MedicationsProvider>
            </ImagingRequestsProvider>
          </EncounterProvider>
        </DateTimeProvider>
      </SettingsProvider>
    </AuthProvider>
  </EncounterNotesProvider>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function RootContent({ store }) {
  return (
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
  );
}

function Root({ api, store }) {
  // We need to use the createBrowserRouter function to create the router in data mode
  // for the notes blocking feature @see https://reactrouter.com/start/modes
  const router = React.useMemo(
    () =>
      createBrowserRouter([
        {
          path: '*',
          element: <RootContent store={store} />,
        },
      ]),
    [store],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ApiContext.Provider value={api}>
          <RouterProvider router={router} />
        </ApiContext.Provider>
      </Provider>
    </QueryClientProvider>
  );
}

export function renderRootInto(root, props) {
  root.render(<Root {...props} />);
}
