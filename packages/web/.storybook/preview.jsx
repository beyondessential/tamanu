import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { CssBaseline } from '@material-ui/core';
import { DateTimeProvider } from '@tamanu/ui-components';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { MemoryRouter } from 'react-router';
import { theme } from '../app/theme';
import { SettingsProvider } from '../app/contexts/Settings';
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
                <MemoryRouter>
                  <SettingsProvider>
                    <AuthProvider>
                      <DateTimeProvider>
                        <CssBaseline />
                        <LocalisationProvider>
                          <TranslationProvider>
                            <MockedApi endpoints={defaultEndpoints}>
                              <Story />
                            </MockedApi>
                          </TranslationProvider>
                        </LocalisationProvider>
                      </DateTimeProvider>
                    </AuthProvider>
                  </SettingsProvider>
                </MemoryRouter>
              </QueryClientProvider>
            </ThemeProvider>
          </MuiThemeProvider>
        </StylesProvider>
      </Provider>
    ),
  ],
};

export default preview;
