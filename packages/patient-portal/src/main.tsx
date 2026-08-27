import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { jssPreset, MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import MuiLatestThemeProvider from '@mui/material/styles/ThemeProvider';
import { create as createJss } from 'jss';
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

/**
 * MUI v4 (JSS) and MUI v6 (emotion) generate the same global `.MuiXxx-*` class
 * names with equal-specificity rules, so order matters.
 * @see packages/patient-portal/index.html
 */
const jss = createJss({
  plugins: jssPreset().plugins,
  insertionPoint: document.getElementById('jss-insertion-point') ?? undefined,
});
const emotionCache = createCache({
  key: 'css',
  insertionPoint:
    document.querySelector<HTMLElement>('meta[name="emotion-insertion-point"]') ?? undefined,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

async function bootstrap() {
  const api = new TamanuApi(__VERSION__);
  try {
    await api.restoreSession();
  } catch (e) {
    console.error('[Tamanu patient-portal] Session restore failed', e);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ApiContext.Provider value={api}>
          <TranslationProvider>
            <CacheProvider value={emotionCache}>
              <StylesProvider jss={jss}>
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
            </CacheProvider>
          </TranslationProvider>
        </ApiContext.Provider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
