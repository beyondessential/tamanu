import { Colors } from './colors';

export const MUI_SPACING_UNIT = 8;

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
// Global styles for styled-components
export const globalStyles = `
  .pointer-events-none {
    pointer-events: none;
  }
`;

// Complete theme configuration object
export const themeConfig = {
  palette,
  themeName,
  typography,
  shape,
  overrides,
  components,
};
