import { createTheme, Theme } from '@mui/material/styles';
import { TAMANU_COLORS as Colors } from '@tamanu/shared/ui/colors';

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    secondary: true;
  }
}

// Patient portal theme configuration with clean Roboto fonts and proper sizes
const patientPortalThemeConfig = {
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
      unit: 8,
    },
  },
  themeName: 'Tamanu',
  typography: {
    useNextVariants: true,
    fontSize: 15,
    fontFamily: 'Roboto',
    h1: {
      fontFamily: 'Roboto',
      fontSize: '1.5rem', // 24px
      fontWeight: 500,
      lineHeight: 1.2,
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
  shape: {
    borderRadius: 5,
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: Colors.outline,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'background.paper',
        },
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
    MuiCardHeader: {
      styleOverrides: {
        avatar: ({ theme }: { theme: Theme }) => ({
          marginRight: theme.spacing(1),
        }),
      },
    },
  },
};

export const theme = createTheme(patientPortalThemeConfig);
