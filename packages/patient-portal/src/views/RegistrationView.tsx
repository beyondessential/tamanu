import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { styled, Typography } from '@mui/material';

import { Button } from '@tamanu/ui-components';

import { useApi } from '@api/useApi';
import { Card } from '@components/Card';

const IconDisplay = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: '50%',
  width: 'fit-content',
  display: 'flex',
  margin: '0 auto',
  marginBottom: theme.spacing(2),
}));

const useVerifyRegistration = () => {
  const api = useApi();
  return useMutation({
    mutationFn: (token: string) => api.post(`/verify-registration/${token}`),
  });
};

export const RegistrationView = () => {
  const navigate = useNavigate();
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

  return (
    <Card sx={{ width: '425px' }}>
      {error ? (
        <>
          <IconDisplay sx={{ background: 'error.light' }}>
            <ErrorIcon color="error" />
          </IconDisplay>
          <Typography mb={2} variant="h2">
            Failed to create account
          </Typography>
          <Typography variant="body1" gutterBottom>
            {error.message}
          </Typography>
        </>
      ) : (
        <>
          <IconDisplay sx={{ background: 'success.light' }}>
            <CheckCircleIcon color="success" />
          </IconDisplay>
          <Typography mb={2} variant="h2">
            Account successfully created!
          </Typography>
          <Typography variant="body1" mb={3} color="text.secondary">
            Continue to log in to access the Patient Portal.
          </Typography>
          <Button onClick={() => navigate('/login')} fullWidth variant="contained">
            Continue to log in
          </Button>
        </>
      )}
    </Card>
  );
};
