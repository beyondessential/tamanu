import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import React from 'react';

import { Alert } from '@tamanu/ui-components';

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
