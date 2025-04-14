import React from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';

export const ErrorMessage = ({ title, errorMessage, error }) => {
  return (
    <Box p={5} mb={4} data-testid='box-d3kl'>
      <Alert severity="error" data-testid='alert-80m3'>
        <AlertTitle data-testid='alerttitle-jiu4'>{title}</AlertTitle>
        {errorMessage}
        {error ? <pre>{error.stack}</pre> : ''}
      </Alert>
    </Box>
  );
};
