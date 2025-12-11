import React, { ReactElement, useMemo } from 'react';
import { ThemeProvider } from 'styled-components/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import './ui/reactotron';
import { BackendProvider } from './ui/contexts/BackendContext';
import { RootStack } from './ui/navigation/stacks/Root';
import { theme } from './ui/styled/theme';
import { themeSystem } from './ui/styled/common';

export const App = (): ReactElement => {
  const paperTheme = useMemo(() => ({
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.PRIMARY_MAIN,
      accent: theme.colors.SECONDARY_MAIN,
    },
  }), []);

  return (
    <ThemeProvider theme={themeSystem}>
      <PaperProvider theme={paperTheme}>
        <BackendProvider Component={RootStack} />
      </PaperProvider>
    </ThemeProvider>
  );
};
