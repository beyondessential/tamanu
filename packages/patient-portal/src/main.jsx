import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import './fonts.css';
import { RoutingApp } from './RoutingApp';
import { theme } from './theme/theme';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RoutingApp />
    </ThemeProvider>
  </StrictMode>,
);
