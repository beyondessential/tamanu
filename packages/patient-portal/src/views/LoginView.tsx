import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

export const LoginView = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Login
          </Typography>
          <Typography variant="body1" gutterBottom>
            Login Page Content
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};
