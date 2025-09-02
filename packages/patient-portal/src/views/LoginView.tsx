import React from 'react';
import { Box, Typography } from '@mui/material';
import { Button } from '@tamanu/ui-components';
import { useLocation } from 'react-router';
import { useLogin } from '@api/mutations';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';

import { TextField } from '../components/TextField';
import { Card } from '../components/Card';

export const LoginView = () => {
  const { mutate: login } = useLogin();
  const location = useLocation();

  const storedEmail = location.state?.email;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const loginToken = formData.get('verificationCode') as string;

    const email = storedEmail || (formData.get('email') as string);

    if (loginToken && email) {
      loginToken.trim();
      email.trim();
      login({ loginToken, email });
    }
  };

  return (
    <Card>
      <Box display="flex" alignItems="center" justifyContent="center" gap={0.75} mb={1}>
        <ShieldIcon fontSize='small' color="primary" />
        <Typography variant="h3">
          Account authentication
        </Typography>
      </Box>
      <Typography>We’ve sent a 6-digit verification code to your email address</Typography>
      <form onSubmit={handleSubmit}>
        {!storedEmail && (
          <TextField
            label="Email Address"
            fullWidth
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
            autoFocus
            sx={{ mb: 2 }}
          />
        )}
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
    </Card>
  );
};
