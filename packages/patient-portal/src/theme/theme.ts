import { createTheme } from '@mui/material/styles';
// @ts-ignore - Using JS package without types for now
import { themeConfig } from '@tamanu/shared/ui/theme';
declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    secondary: true;
  }
}

export const theme = createTheme({
  ...themeConfig,
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
  },
});
