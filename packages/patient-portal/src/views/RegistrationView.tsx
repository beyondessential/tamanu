import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@tamanu/ui-components';
import { Typography } from '@mui/material';
import { useApi } from '@api/useApi';

const useVerifyRegistration = () => {
  const api = useApi();
  return useMutation({
    mutationFn: (token: string) => api.post(`/verify-registration/${token}`),
  });
};

export const RegistrationView = () => {
  const { token } = useParams();
  const { mutate: verify, error, isPending } = useVerifyRegistration();

  useEffect(() => {
    if (token) {
      verify(token);
    }
  }, []); // just run once on page mount

  if (isPending) {
    return null;
  }

  if (error) {
    return (
      <>
        <Typography variant="h2" component="h1" gutterBottom>
          Error
        </Typography>
        <Typography variant="body1" gutterBottom>
          {error.message}
        </Typography>
      </>
    );
  }

  return (
    <>
      <Typography variant="h2" component="h1" gutterBottom>
        Account successfully created!
      </Typography>
      <Typography variant="body1" gutterBottom>
        Continue to log in to access the Patient Portal.
      </Typography>
      <Button type="submit" fullWidth variant="contained">
        Continue to login
      </Button>
    </>
  );
};
