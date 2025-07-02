import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '../src/theme/theme';
import '../src/fonts.css'; // ← this loads your custom fonts globally

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    options: {
      storySort: {
        order: ['Components', '*'],
      },
    },
  },
};

export default preview;