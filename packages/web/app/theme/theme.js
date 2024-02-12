/*
 * Tamanu
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { createTheme } from '@material-ui/core/styles';
import { Colors, MUI_SPACING_UNIT } from '../constants';

const themeName = 'Tamanu';
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

// We want to use Khmer fonts for Khmer text, and Roboto for everything else. We have set the font-face
// in fonts.css to only apply to khmer unicode characters. If more languages are added, we should
// probably convert this into a more dynamic solution that generates the strings from font object.
const FONTS = {
  KHMER: {
    HEADING: 'Moul',
    BODY: 'Battambang',
  },
  DEFAULT: {
    HEADING: 'Roboto',
    BODY: 'Roboto',
  }
}

const bodyFontVariants = [FONTS.KHMER.BODY, FONTS.DEFAULT.BODY].join(', ');
const headingFontVariants = [FONTS.KHMER.HEADING, FONTS.DEFAULT.HEADING].join(', ');

const typography = {
  useNextVariants: true,
  fontSize: 15,
  fontFamily: bodyFontVariants,
  h1: { fontFamily: headingFontVariants },
  h2: { fontFamily: headingFontVariants },
  h3: { fontFamily: headingFontVariants },
  h4: { fontFamily: headingFontVariants },
  h5: { fontFamily: headingFontVariants },
  h6: { fontFamily: headingFontVariants },
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

export const theme = createTheme({ palette, themeName, typography, shape, overrides });
