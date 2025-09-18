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
      light: '#FFF0EE',
    },
    success: {
      main: TAMANU_COLORS.safe,
      light: '#EDFAF3',
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
    h1: {
      fontFamily: 'Roboto',
      fontSize: '2rem', // 32px
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'Roboto',
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h3: {
      fontFamily: 'Roboto',
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h4: {
      fontFamily: 'Roboto',
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h5: {
      fontFamily: 'Roboto',
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: 'Roboto',
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '0.875rem', // 14px - Your desired body text size
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.4,
    },
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
      variants: [
        {
          props: { variant: 'secondary' as const },
          style: {
            backgroundColor: '#F9FAFB',
          },
        },
        {
          props: { variant: 'outlined' as const },
          style: {
            border: '1px solid divider',
          },
        },
      ],
    },
    MuiOutlinedInput: {
      notchedOutline: {
        borderColor: TAMANU_COLORS.outline,
      },
    },
  },
};

export const theme = createTheme(themeConfig);
