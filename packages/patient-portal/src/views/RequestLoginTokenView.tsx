import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Button } from '@tamanu/ui-components';
import { useRequestLoginToken } from '@api/mutations';
import { TextField } from '../components/TextField';
import { Card } from '../components/Card';
import { z } from 'zod';

const LoginButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const RequestLoginTokenView = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { mutate: submit } = useRequestLoginToken({
    onSuccess: ({ email }) => {
      navigate('/login-submit', { state: { email } });
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: incorporate form library for validation or port from web to ui-components.
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    email?.trim();
    if (!email) {
      setError('*Required');
      return;
    }
    const { success: emailValid } = z.email().safeParse(email);
    if (!emailValid) {
      setError('Please enter a valid email');
      return;
    }

    submit(email);
  };

  return (
    <Card>
      <Typography variant="h1" component="h1" gutterBottom>
        Log In
      </Typography>
      <Typography variant="body1" mb={3} color="text.secondary">
        Enter your email below to log in
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
          onChange={() => error && setError(null)}
          autoFocus
        />
        <LoginButton type="submit" fullWidth variant="contained">
          Send code
        </LoginButton>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          <strong>Issue with your email?</strong> If you have forgotten or lost access to your
          email, please contact the health facility associated with your Patient Portal.
        </Typography>
      </form>
    </Card>
  );
};
