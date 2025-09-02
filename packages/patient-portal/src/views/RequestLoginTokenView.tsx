import React from 'react';
import { useNavigate } from 'react-router';
import { Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Button } from '@tamanu/ui-components';
import { useRequestLoginToken } from '@api/mutations';

import { TextField } from '../components/TextField';
import { Card } from '../components/Card';

const LoginButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const RequestLoginTokenView = () => {
  const navigate = useNavigate();

  const { mutate: submit } = useRequestLoginToken({
    onSuccess: ({ email }) => {
      navigate('/login-submit', { state: { email } });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    if (email) {
      email.trim();
      submit(email);
    }
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
          type="email"
          name="email"
          id="email"
          required
          autoComplete="email"
          autoFocus
        />
        <LoginButton type="submit" fullWidth variant="contained">
          Log in
        </LoginButton>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          <strong>Issue with your email?</strong> If you have forgotten or lost access to your email, please
          contact the facility.
        </Typography>
      </form>
    </Card>
  );
};
