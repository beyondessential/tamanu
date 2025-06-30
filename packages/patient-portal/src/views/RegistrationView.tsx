import React from 'react';
import { useParams } from 'react-router';
import { Box, Typography, Container, Paper } from '@mui/material';

export const RegistrationView = () => {
  const { token } = useParams();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Registration
          </Typography>
          <Typography variant="body1" gutterBottom>
            Registration Page Content
          </Typography>
          {token && (
            <Typography variant="body2" color="text.secondary">
              Registration token: {token}
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
