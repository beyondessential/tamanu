import React from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';

export const ErrorMessage = ({ title, errorMessage, error }) => {
  return (
    <Box p={5} mb={4}>
      <Alert severity="error">
        <AlertTitle>{title}</AlertTitle>
        {errorMessage}
        {error ? <pre>error.stack</pre> : ''}
      </Alert>
    </Box>
  );
};
