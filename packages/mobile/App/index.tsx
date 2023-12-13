import React, { ReactElement } from 'react';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from 'styled-components/native';
import './ui/reactotron';
import { BackendProvider } from './ui/contexts/BackendContext';
import { RootStack } from './ui/navigation/stacks/Root';
import { themeSystem } from './ui/styled/common';
import { theme } from './ui/styled/theme';

const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.PRIMARY_MAIN,
    accent: theme.colors.SECONDARY_MAIN,
  },
};

export const App = (): ReactElement => (
  <ThemeProvider theme={themeSystem}>
    <PaperProvider theme={paperTheme}>
      <BackendProvider Component={RootStack} />
    </PaperProvider>
  </ThemeProvider>
);
