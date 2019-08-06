import React from 'react';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
import { MUI_SPACING_UNIT } from '../constants';

const palette = {
  primary: {
    main: '#326699',
    textLight: '#fff', // taken from colors.scss::$main-white-color
    textMedium: '#2f4358' // taken from colors.scss::$main-light-dark-color
  },
  secondary: {
    main: '#ffcc24',
    dark: '#905a00',
  },
  background: {
    paper: 'white',
    default: grey[200],
    header:  '#EAF2FF', // taken from colors.scss::$main-light-blue-color
    light: '#F4F6F8', // taken from colors.scss::$main-light-gray-color
    main: '#eff2f5' // taken from colors.scss::$main-bg-color
  },
  spacing: {
    unit: MUI_SPACING_UNIT,
  },
};
const themeName = 'Tamanu';
const typography = { useNextVariants: true, fontSize: 15 };
const theme = createMuiTheme({ palette, themeName, typography });

export const ThemeProvider = props => <MuiThemeProvider theme={theme} {...props} />;
