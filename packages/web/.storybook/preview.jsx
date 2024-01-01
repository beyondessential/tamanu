import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';

import { theme } from '../app/theme';
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
                <CssBaseline />
                <LocalisationProvider>
                  <MockedApi endpoints={defaultEndpoints}>
                    <Story />
                  </MockedApi>
                </LocalisationProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </MuiThemeProvider>
        </StylesProvider>
      </ConnectedRouter>
    </Provider>
  ),
];
