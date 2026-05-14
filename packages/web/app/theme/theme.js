import { Colors } from '../constants/styles';
import { createTheme } from '@material-ui/core/styles';
import { MUI_SPACING_UNIT } from '../constants';

const cssReset = {
  fieldset: {
    border: 0,
    margin: 0,
    minWidth: 0,
    padding: 0,
  },
  html: {
    interpolateSize: 'allow-keywords',
    textWrap: 'pretty',
  },
  button: { font: 'inherit' },
  ':where(button, figcaption, h1, h2, h3, h4, h5, h6, label)': {
    textWrap: 'balance',
  },
  ':where(button, input, textarea, select)': {
    touchAction: 'manipulation',
  },
  ':where(table, time)': {
    fontVariantNumeric: 'lining-nums slashed-zero tabular-nums',
  },
};

const themeConfig = {
  themeName: 'Tamanu',
  palette: {
    primary: {
      main: Colors.primary,
      dark: Colors.primaryDark,
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
  },
  typography: {
    useNextVariants: true,
    fontSize: 15,
    fontFamily: 'Roboto',
  },
  shape: { borderRadius: 3 },
  overrides: {
    MuiCssBaseline: { '@global': cssReset },
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
    MuiFormHelperText: {
      root: {
        color: Colors.midText,
        fontSize: '11px',
        lineHeight: '1.4',
      },
    },
  },
  // Required as we are now using the latest version of MUI, which has a different structure for component override
  components: {
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
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: Colors.midText,
          fontSize: '11px',
          lineHeight: '1.4',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          textTransform: 'none',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 400,
          minInlineSize: '4em',
          textTransform: 'none',
          '&.Mui-selected': {
            borderColor: Colors.primary,
          },
        },
      },
    },
  },
};

export const theme = createTheme(themeConfig);
