import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MuiThemeProvider, StylesProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import MuiLatestThemeProvider from '@mui/material/styles/ThemeProvider';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiContext, CustomToastContainer, DateTimeProvider } from '@tamanu/ui-components';
import '@fontsource/roboto';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/600.css';
import './fonts.css';
import { App } from './App';
import { theme } from './theme/theme';
import { TamanuApi } from '@api/TamanuApi';
import { useConfigQuery } from '@api/queries/useConfigQuery';
import { TranslationProvider } from './contexts';
import { StyledCircularProgress } from '@components/StyledCircularProgress';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const DateTimeProviderWithConfig = ({ children }: { children: React.ReactNode }) => {
  const { data: config, isPending, isError } = useConfigQuery();

  if (isPending) {
    return <StyledCircularProgress />;
  }

  if (isError || !config?.countryTimeZone) {
    return <div>There was an error loading application configuration. Please try again later.</div>;
  }

  return (
    <DateTimeProvider countryTimeZone={config.countryTimeZone}>
      {children}
    </DateTimeProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={new TamanuApi(__VERSION__)}>
        <DateTimeProviderWithConfig>
          <TranslationProvider>
            <StylesProvider injectFirst>
              <MuiLatestThemeProvider theme={theme}>
                <MuiThemeProvider theme={theme}>
                  <ThemeProvider theme={theme}>
                    <CustomToastContainer />
                    <CssBaseline />
                    <App />
                  </ThemeProvider>
                </MuiThemeProvider>
              </MuiLatestThemeProvider>
            </StylesProvider>
          </TranslationProvider>
        </DateTimeProviderWithConfig>
      </ApiContext.Provider>
    </QueryClientProvider>
  </StrictMode>,
);
