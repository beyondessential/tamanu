import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

export const MainView = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Portal Dashboard
          </Typography>
          <Typography variant="body1" gutterBottom>
            Main View Content - This is the homepage after login
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};
