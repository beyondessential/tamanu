import React from 'react';
import { Box, Typography } from '@mui/material';
import { Button } from '@tamanu/ui-components';
import { useLocation } from 'react-router';
import { useLogin } from '@api/mutations';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';

import { TextField } from '../components/TextField';
import { Card } from '../components/Card';
import { VerificationCodeInput } from '../components/VerificationCodeInput';


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
      {storedEmail && (
        <Box>
          <Typography variant="body2">
            Email sent to {storedEmail.replace(/^(.{1,3}).*(@.*)/, '$1*******$2')}
          </Typography>
        </Box>
      )}

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
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
          Enter 6-digit verification code
        </Typography>
        <VerificationCodeInput name="verificationCode" />
        <Button type="submit" fullWidth variant="contained">
          Log in
        </Button>
      </form>
    </Card>
  );
};
