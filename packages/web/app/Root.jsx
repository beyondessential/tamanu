import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline } from '@material-ui/core';
import { jssPreset, MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import MuiLatestThemeProvider from '@mui/material/styles/ThemeProvider';
import { create as createJss } from 'jss';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider as MuiLocalisationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Slide } from 'react-toastify';
import { StyleSheetManager, ThemeProvider } from 'styled-components';

import { ApiContext, CustomToastContainer, DateTimeProvider } from '@tamanu/ui-components';
import { ClearIcon } from './components/Icons/ClearIcon';
import { AuthProvider } from './contexts/Auth';
import { EncounterProvider } from './contexts/Encounter';
import { ImagingRequestsProvider } from './contexts/ImagingRequests';
import { LabRequestProvider } from './contexts/LabRequest';
import { LocalisationProvider } from './contexts/Localisation';
import { MedicationsProvider } from './contexts/Medications';
import { NoteModalProvider } from './contexts/NoteModal';
import { PatientSearchProvider } from './contexts/PatientSearch';
import { ProgramRegistryProvider } from './contexts/ProgramRegistry';
import { SettingsProvider } from './contexts/Settings';
import { SyncStateProvider } from './contexts/SyncState';
import { TranslationProvider } from './contexts/Translation';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme';

const StateContextProviders = ({ children, store }) => (
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
);

function StyledComponentsProvider({ children }) {
  return (
    <StyleSheetManager disableVendorPrefixes>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyleSheetManager>
  );
}

/**
 * MUI v4 (JSS) and MUI v6 (emotion) generate the same global `.MuiXxx-*` class
 * names with equal-specificity rules, so order matters.
 * @see packages/web/index.html
 */
const jss = createJss({
  plugins: jssPreset().plugins,
  insertionPoint: document.getElementById('jss-insertion-point') ?? undefined,
});
const emotionCache = createCache({
  key: 'css',
  insertionPoint: document.querySelector('meta[name="emotion-insertion-point"]') ?? undefined,
});

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
    <CacheProvider value={emotionCache}>
      <StylesProvider jss={jss}>
        <MuiLatestThemeProvider theme={theme}>
          <MuiThemeProvider theme={theme}>
            <StyledComponentsProvider>
              <MuiLocalisationProvider dateAdapter={AdapterDateFns}>
                <StateContextProviders store={store}>
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
            </StyledComponentsProvider>
          </MuiThemeProvider>
        </MuiLatestThemeProvider>
      </StylesProvider>
    </CacheProvider>
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
