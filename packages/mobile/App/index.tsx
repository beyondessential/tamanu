import React, { type ReactElement } from 'react';
import { ThemeProvider } from 'styled-components/native';
import { MD2LightTheme as DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import './ui/reactotron';
import { preloadSession } from './ui/contexts/AuthContext';
import { BackendProvider } from './ui/contexts/BackendContext';
import { preloadSelectedPatient } from './ui/contexts/SelectedPatientContext';
import { RootStack } from './ui/navigation/stacks/Root';
import { theme } from './ui/styled/theme';
import { themeSystem } from './ui/styled/common';
import queryClient from './ui/queryClient';

// The first screen waits on the stored session and selected patient, and a sync that starts
// with the backend needs the session's tokens. Reading both starts here, while the backend
// starts, so neither is still to be fetched when their providers mount.
preloadSession();
preloadSelectedPatient();

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.PRIMARY_MAIN,
    accent: theme.colors.SECONDARY_MAIN,
    secondary: theme.colors.SECONDARY_MAIN,
  },
};

export const App = (): ReactElement => (
  <ThemeProvider theme={themeSystem}>
    <PaperProvider theme={paperTheme}>
      <QueryClientProvider client={queryClient}>
        <BackendProvider Component={RootStack} />
      </QueryClientProvider>
    </PaperProvider>
  </ThemeProvider>
);
