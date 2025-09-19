import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
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

const getErrorMessage = (error: Error) => {
  const { message } = error;
  if (message.includes('Invalid registration token')) {
    return 'Broken registration link';
  }
  if (message.includes('Verification code has expired')) {
    return 'Registration link expired';
  }
  return 'An error occurred while verifying registration';
};

const useVerifyRegistration = () => {
  const api = useApi();

  return useMutation({
    mutationFn: (token: string) => api.post('/verify-registration', { token } as any),
  });
};

export const RegistrationView = () => {
  const history = useHistory();
  const { token } = useParams<{ token: string }>();
  const { mutate: verify, error, isPending } = useVerifyRegistration();

  useEffect(() => {
    if (token) {
      verify(token);
    }
  }, [verify, token]);

  if (isPending) {
    return null;
  }

  return (
    <Card sx={{ width: '425px' }}>
      {error ? (
        <>
          <Typography mb={2} variant="h2">
            {getErrorMessage(error)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please contact the sending facility to resend a new link.
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
          <Button onClick={() => history.push('/login')} fullWidth variant="contained">
            Continue to log in
          </Button>
        </>
      )}
    </Card>
  );
};
