import React from 'react';
import { Typography, TextField } from '@mui/material';
import { Button } from '@tamanu/ui-components';
import { useAuth } from '@auth/useAuth';

export const LoginView = () => {
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const token = formData.get('verificationCode') as string;

    if (token.trim()) {
      login(token);
    }
  };

  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Account authentication
      </Typography>
      <Typography>Enter your email below to log in</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          type="text"
          label="Enter 6-digit verification code"
          name="verificationCode"
          required
        />
        <Button type="submit" fullWidth variant="contained">
          Log in
        </Button>
      </form>
    </>
  );
};
