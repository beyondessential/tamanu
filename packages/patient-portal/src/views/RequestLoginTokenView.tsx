import React, { useMemo, useState } from 'react';
import { z } from 'zod';
import { useHistory, useLocation } from 'react-router-dom';
import { Alert, Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Button } from '@tamanu/ui-components';
import { useRequestLoginToken } from '@api/mutations';

import { TextField } from '@components/TextField';
import { Card } from '@components/Card';

const LoginButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const RequestLoginTokenView = () => {
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const location = useLocation();
  const expired = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('reason') === 'expired';
  }, [location.search]);

  const { mutate: submit } = useRequestLoginToken({
    onSuccess: ({ email }) => {
      history.push('/login-submit', { email });
    },
    onError: error => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: incorporate form library for validation or port from web to ui-components.
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = (formData.get('email') as string)?.trim();
    if (!email) {
      setError('*Required');
      return;
    }
    const { success: emailValid } = z.email().safeParse(email);
    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    submit(email);
  };

  const resetError = () => {
    if (!error) return;
    setError(null);
  };

  return (
    <Card>
      {expired && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body1">  
          Your session expired. Please log in again.
          </Typography>
        </Alert>
      )}
      <Typography variant="h1" component="h1" gutterBottom>
        Log In
      </Typography>
      <Typography variant="body1" mb={3} color="text.secondary">
        Enter your email below. We will send a verification code for account authentication.
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          fullWidth
          name="email"
          id="email"
          autoComplete="email"
          error={!!error}
          helperText={error}
          onChange={resetError}
          autoFocus
          required
        />
        <LoginButton type="submit" fullWidth variant="contained">
          Send code
        </LoginButton>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          <strong>Issue with your email?</strong> If you have forgotten or lost access to your
          email, please contact the healthcare facility associated with your Patient Portal.
        </Typography>
      </form>
    </Card>
  );
};
