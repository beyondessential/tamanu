import { createTheme, Theme } from '@mui/material/styles';
import { themeConfig } from '@tamanu/shared/ui/theme';

// Augment the Material-UI theme to include custom Card variants
declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    secondary: true;
  }
}

// Override the typography for patient portal with clean Roboto fonts and proper sizes
const patientPortalThemeConfig = {
  ...themeConfig,
  typography: {
    ...themeConfig.typography,
    fontFamily: 'Roboto',
    h1: {
      fontFamily: 'Roboto',
      fontSize: '2rem', // 32px
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'Roboto',
      fontSize: '1.75rem', // 28px
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: 'Roboto',
      fontSize: '1.5rem', // 24px
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: 'Roboto',
      fontSize: '1rem', // 16px - Your desired bold 16px heading
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
  components: {
    ...themeConfig.components,
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
