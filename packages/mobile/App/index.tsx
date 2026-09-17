import React, { type ReactElement } from 'react';
import { ThemeProvider } from 'styled-components/native';
import { MD2LightTheme as DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import './ui/reactotron';
import { BackendProvider } from './ui/contexts/BackendContext';
import { RootStack } from './ui/navigation/stacks/Root';
import { theme } from './ui/styled/theme';
import { themeSystem } from './ui/styled/common';
import queryClient from './ui/queryClient';

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
