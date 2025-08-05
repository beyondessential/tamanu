import React from 'react';
import { Box, Container } from '@mui/material';

import { PageHeader } from './PageHeader';

export const PrivatePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box component="main" sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <PageHeader />
      <Container maxWidth="lg" sx={{ p: 1.25 }}>
        {children}
      </Container>
    </Box>
  );
};
