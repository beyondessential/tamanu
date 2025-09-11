import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import MuiLatestThemeProvider from '@mui/material/styles/ThemeProvider';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/roboto';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/600.css';
import './fonts.css';
import { App } from './App';
import { theme } from './theme/theme';
import { ApiContext } from '@api/ApiContext';
import { TamanuApi } from '@api/TamanuApi';
import { SettingsProvider, TranslationProvider } from './contexts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={new TamanuApi(__VERSION__)}>
        <SettingsProvider>
          <TranslationProvider>
            <StylesProvider injectFirst>
              <MuiLatestThemeProvider theme={theme}>
                <MuiThemeProvider theme={theme}>
                  <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App />
                  </ThemeProvider>
                </MuiThemeProvider>
              </MuiLatestThemeProvider>
            </StylesProvider>
          </TranslationProvider>
        </SettingsProvider>
      </ApiContext.Provider>
    </QueryClientProvider>
  </StrictMode>,
);
