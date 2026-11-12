import React, { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Button, TranslatedText, useTranslation } from '@tamanu/ui-components';
import { useRequestLoginToken } from '@api/mutations';

import { TextField } from '@components/TextField';
import { Card } from '@components/Card';

const LoginButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const RequestLoginTokenView = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { getTranslation } = useTranslation();

  const { mutate: submit } = useRequestLoginToken({
    onSuccess: ({ email }) => {
      navigate('/login-submit', { state: { email } });
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
      setError(getTranslation('validation.required.inline', '*Required'));
      return;
    }
    const { success: emailValid } = z.email().safeParse(email);
    if (!emailValid) {
      setError(
        getTranslation('patientPortal.login.invalidEmail', 'Please enter a valid email address'),
      );
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
      <Typography variant="h1" component="h1" gutterBottom>
        <TranslatedText stringId="patientPortal.login.title" fallback="Log in" />
      </Typography>
      <Typography variant="body1" mb={3} color="text.secondary">
        <TranslatedText
          stringId="patientPortal.login.requestCode.text"
          fallback="Enter your email below. We will send a verification code for account authentication."
        />
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label={getTranslation('patientPortal.login.email', 'Email')}
          fullWidth
          name="email"
          id="email"
          autoComplete="email"
          error={!!error}
          helperText={error}
          onChange={resetError}
          autoFocus
          required
          type="email"
        />
        <LoginButton type="submit" fullWidth variant="contained">
          <TranslatedText stringId="patientPortal.login.sendCode" fallback="Send code" />
        </LoginButton>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          <strong>
            <TranslatedText
              stringId="patientPortal.login.emailIssue.heading"
              fallback="Issue with your email?"
            />
          </strong>{' '}
          <TranslatedText
            stringId="patientPortal.login.emailIssue.text"
            fallback="If you have forgotten or lost access to your email, please contact the healthcare facility associated with your Patient Portal."
          />
        </Typography>
      </form>
    </Card>
  );
};
