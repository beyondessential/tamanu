import React from 'react';
import { useNavigate } from 'react-router';
import { Typography, TextField } from '@mui/material';
import { Button } from '@tamanu/ui-components';
import { useRequestLoginToken } from '@api/mutations';

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
    <>
      <Typography variant="h1" component="h1" gutterBottom>
        Log In
      </Typography>
      <Typography>Enter your email below to log in</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          type="email"
          name="email"
          label="Email Address"
          required
          autoComplete="email"
          autoFocus
        />
        <Button type="submit" fullWidth variant="contained">
          Log in
        </Button>
      </form>
    </>
  );
};
