import React from 'react';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import { MUI_SPACING_UNIT } from '../constants';

const palette = {
  primary: {
    main: '#326699',
  },
  secondary: {
    main: '#ffcc24',
    dark: '#905a00',
  },
  background: {
    paper: 'white',
    default: grey[200],
  },
  spacing: {
    unit: MUI_SPACING_UNIT,
  },
};
const themeName = 'Tamanu';
const typography = { useNextVariants: true, fontSize: 15 };
const theme = createMuiTheme({ palette, themeName, typography });

export const ThemeProvider = (props) => (
  <MuiThemeProvider theme={theme} {...props} />
);
