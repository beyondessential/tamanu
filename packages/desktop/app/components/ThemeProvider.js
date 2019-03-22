import React from 'react';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

const palette = {
  primary: {
    main: '#326699',
  },
  secondary: {
    main: '#ffcc24',
    dark: '#905a00',
  },
};
const themeName = 'Tamanu';
const typography = { useNextVariants: true };
const theme = createMuiTheme({ palette, themeName, typography });

export const ThemeProvider = (props) => (
  <MuiThemeProvider theme={theme} {...props} />
);
