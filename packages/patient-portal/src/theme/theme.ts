import { createTheme } from '@material-ui/core/styles';
import { TAMANU_COLORS } from '@tamanu/ui-components';

const MUI_SPACING_UNIT = 8;

// Patient portal theme configuration with clean Roboto fonts and proper sizes
const themeConfig = {
  themeName: 'Tamanu',
  palette: {
    primary: {
      main: TAMANU_COLORS.primary,
      dark: TAMANU_COLORS.primaryDark,
    },
    secondary: {
      main: TAMANU_COLORS.secondary,
      dark: '#905a00',
    },
    error: {
      main: TAMANU_COLORS.alert,
    },
    success: {
      main: TAMANU_COLORS.safe,
    },
    text: {
      primary: TAMANU_COLORS.darkestText,
      secondary: TAMANU_COLORS.darkText,
      tertiary: TAMANU_COLORS.midText,
    },
    background: {
      default: TAMANU_COLORS.background,
      paper: TAMANU_COLORS.white,
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
    MuiCard: {
      root: {
        borderColor: TAMANU_COLORS.outline,
      },
    },
    MuiOutlinedInput: {
      notchedOutline: {
        borderColor: TAMANU_COLORS.outline,
      },
    },
  },
  // Required as we are now using the latest version of MUI, which has a different structure for component override
  components: {
    MuiCard: {
      root: {
        borderColor: TAMANU_COLORS.outline,
      },
    },
    MuiOutlinedInput: {
      notchedOutline: {
        borderColor: TAMANU_COLORS.outline,
      },
    },
  },
};

export const theme = createTheme(themeConfig);
