/*
 * Tamanu
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { createTheme, adaptV4Theme } from '@mui/material/styles';
import { Colors, MUI_SPACING_UNIT } from '../constants';
import { createGlobalStyle } from 'styled-components';

const themeName = 'Tamanu';

// Global styles component
export const GlobalStyles = createGlobalStyle`
  .pointer-events-none {
    pointer-events: none;
  }
`;

const palette = {
  primary: {
    main: Colors.primary,
    dark: Colors.dark,
  },
  secondary: {
    main: Colors.secondary,
    dark: '#905a00',
  },
  error: {
    main: Colors.alert,
  },
  success: {
    main: Colors.safe,
  },
  text: {
    primary: Colors.darkestText,
    secondary: Colors.darkText,
    tertiary: Colors.midText,
  },
  background: {
    default: Colors.background,
    paper: Colors.white,
    header: '#EAF2FF', // taken from colors.scss::$main-light-blue-color
    light: '#F4F6F8', // taken from colors.scss::$main-light-gray-color
    main: '#eff2f5', // taken from colors.scss::$main-bg-color
  },
  spacing: {
    unit: MUI_SPACING_UNIT,
  },
};

const typography = {
  useNextVariants: true,
  fontSize: 15,
  fontFamily: 'Roboto',
};
const shape = { borderRadius: 3 };
const overrides = {
  MuiCard: {
    root: {
      borderColor: Colors.outline,
    },
  },
  MuiOutlinedInput: {
    notchedOutline: {
      borderColor: Colors.outline,
    },
  },
};

// Required as we are now using the latest version of MUI, which has a different structure for component overrides
const components = {
  MuiOutlinedInput: {
    styleOverrides: {
      notchedOutline: {
        borderColor: Colors.outline,
      },
    },
  },
};

export const theme = createTheme(adaptV4Theme({ palette, themeName, typography, shape, overrides, components }));
