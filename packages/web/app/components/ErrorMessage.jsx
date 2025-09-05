import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

export const ErrorMessage = ({ title, errorMessage, error }) => {
  return (
    <Box p={5} mb={4} data-testid="box-d3kl">
      <Alert severity="error" data-testid="alert-80m3">
        <AlertTitle data-testid="alerttitle-jiu4">{title}</AlertTitle>
        {errorMessage}
        {error ? <pre>{error.stack}</pre> : ''}
      </Alert>
    </Box>
  );
};
