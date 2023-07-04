import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { DummyElectronProvider } from '../app/contexts/Electron';

import React from 'react';
import { theme } from '../app/theme';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { LocalisationProvider } from '../app/contexts/Localisation';
import { store, history } from './__mocks__/store';
import { MockedApi } from '../stories/utils/mockedApi';
import { defaultEndpoints } from './__mocks__/defaultEndpoints';

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
                  <LocalisationProvider>
                    <MockedApi endpoints={defaultEndpoints}>
                      <Story />
                    </MockedApi>
                  </LocalisationProvider>
                </DummyElectronProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </MuiThemeProvider>
        </StylesProvider>
      </ConnectedRouter>
    </Provider>
  ),
];
