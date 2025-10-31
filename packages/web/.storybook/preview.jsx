import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { theme } from '../app/theme';
import { TranslationProvider } from '../app/contexts/Translation';
import { LocalisationProvider } from '../app/contexts/Localisation';
import { store } from './__mocks__/store';
import { MockedApi } from '../stories/utils/mockedApi';
import { defaultEndpoints } from './__mocks__/defaultEndpoints';
import { AuthProvider } from '../app/contexts/Auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const preview = {
  decorators: [
    Story => (
      <Provider store={store}>
        <StylesProvider injectFirst>
          <MuiThemeProvider theme={theme}>
            <ThemeProvider theme={theme}>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                <CssBaseline />
                <LocalisationProvider>
                  <TranslationProvider>
                    <MockedApi endpoints={defaultEndpoints}>
                      <Story />
                    </MockedApi>
                  </TranslationProvider>
                </LocalisationProvider>
                </AuthProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </MuiThemeProvider>
        </StylesProvider>
      </Provider>
    ),
  ],
};

export default preview;
