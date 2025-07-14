import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../src/theme/theme';
import { AuthContext } from '../src/auth/AuthContext';
import '../src/fonts.css';

import type { Preview } from '@storybook/react-vite';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });

const mockAuthValue = {
  user: { id: 'storybook-user-123', name: 'Storybook User' },
  loading: false,
  login: async () => {},
  logout: async () => {},
};

const preview: Preview = {
  decorators: [
    Story => {
      const queryClient = createQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthValue}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Story />
            </ThemeProvider>
          </AuthContext.Provider>
        </QueryClientProvider>
      );
    },
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
