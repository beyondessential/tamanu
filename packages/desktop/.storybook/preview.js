import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { DummyElectronProvider } from '../app/contexts/Electron';

import React from 'react';
import { initStore } from '../app/store';
import { theme } from '../app/theme';
import { API } from '../app/api/singletons';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Buffer } from 'buffer';
import { DumbLocalisationProvider } from '../app/contexts/Localisation';
import { mockLocalisationData } from './__mocks__/config';
import { createDummyPatient } from 'shared/demoData/patients';

/**
 * Make buffer available to storybook for certificate stories
 */
window.Buffer = Buffer;

const { store, history } = initStore(API, {
  patient: { id: 'test-patient', ...createDummyPatient() },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const decorators = [
  Story => (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <StylesProvider injectFirst>
          <MuiThemeProvider theme={theme}>
            <ThemeProvider theme={theme}>
              <QueryClientProvider client={queryClient}>
                <DummyElectronProvider>
                  <CssBaseline />
                  <DumbLocalisationProvider reduxLocalisation={mockLocalisationData}>
                    <Story />
                  </DumbLocalisationProvider>
                </DummyElectronProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </MuiThemeProvider>
        </StylesProvider>
      </ConnectedRouter>
    </Provider>
  ),
];
