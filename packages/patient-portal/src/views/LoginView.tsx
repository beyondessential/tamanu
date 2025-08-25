import React from 'react';
import { Typography, TextField } from '@mui/material';
import { Button } from '@tamanu/ui-components';
import { useLogin } from '@api/mutations';

export const LoginView = () => {
  const { mutate: login } = useLogin();

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
      <Typography>We’ve sent a 6-digit verification code to your email address</Typography>
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
