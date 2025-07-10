import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import './fonts.css';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme/theme';
import { AuthProvider } from './auth/AuthProvider';
import { ApiContext } from './api/ApiContext';
import { TamanuApi } from './api/TamanuApi';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiContext.Provider value={new TamanuApi(__VERSION__)}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RoutingApp />
        </AuthProvider>
      </ThemeProvider>
    </ApiContext.Provider>
  </StrictMode>,
);
