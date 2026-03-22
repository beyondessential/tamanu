import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import MuiLatestThemeProvider from '@mui/material/styles/ThemeProvider';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ApiContext, CustomToastContainer } from '@tamanu/ui-components';
import '@fontsource/roboto';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/600.css';
import './fonts.css';
import { App } from './App';
import { theme } from './theme/theme';
import { TamanuApi } from '@api/TamanuApi';
import { TranslationProvider } from './contexts';

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
        <TranslationProvider>
          <StylesProvider injectFirst>
            <MuiLatestThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <MuiThemeProvider theme={theme}>
                  <ThemeProvider theme={theme}>
                    <CustomToastContainer />
                    <CssBaseline />
                    <App />
                  </ThemeProvider>
                </MuiThemeProvider>
              </LocalizationProvider>
            </MuiLatestThemeProvider>
          </StylesProvider>
        </TranslationProvider>
      </ApiContext.Provider>
    </QueryClientProvider>
  </StrictMode>,
);
