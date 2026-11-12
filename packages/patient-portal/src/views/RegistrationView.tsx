import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import { styled, Typography } from '@mui/material';

import { Button, TranslatedText } from '@tamanu/ui-components';
import { ERROR_TYPE } from '@tamanu/errors';

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

const RegistrationErrorMessage = ({ error }: { error: unknown }) => {
  const maybeProblem = error as { type?: string; status?: number } | undefined;
  if (maybeProblem?.type === ERROR_TYPE.AUTH_TOKEN_INVALID && maybeProblem.status === 401) {
    return (
      <TranslatedText
        stringId="patientPortal.registration.error.expired"
        fallback="Registration link expired"
      />
    );
  }
  if (maybeProblem?.type === ERROR_TYPE.AUTH_CREDENTIAL_INVALID && maybeProblem.status === 401) {
    return (
      <TranslatedText
        stringId="patientPortal.registration.error.broken"
        fallback="Broken registration link"
      />
    );
  }
  return (
    <TranslatedText
      stringId="patientPortal.registration.error.generic"
      fallback="An error occurred while verifying registration"
    />
  );
};

const useVerifyRegistration = () => {
  const api = useApi();

  return useMutation({
    mutationFn: (token: string) => api.post('verify-registration', { token } as any),
  });
};

export const RegistrationView = () => {
  const navigate = useNavigate();
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
            <RegistrationErrorMessage error={error} />
          </Typography>
          <Typography variant="body1" gutterBottom>
            <TranslatedText
              stringId="patientPortal.registration.error.text"
              fallback="Please contact the sending facility to resend a new link."
            />
          </Typography>
        </>
      ) : (
        <>
          <IconDisplay sx={{ background: 'success.light' }}>
            <CheckCircleIcon color="success" />
          </IconDisplay>
          <Typography mb={2} variant="h2">
            <TranslatedText
              stringId="patientPortal.registration.success.title"
              fallback="Account successfully created!"
            />
          </Typography>
          <Typography variant="body1" mb={3} color="text.secondary">
            <TranslatedText
              stringId="patientPortal.registration.success.text"
              fallback="Continue to log in to access the Patient Portal."
            />
          </Typography>
          <Button onClick={() => navigate('/login')} fullWidth variant="contained">
            <TranslatedText
              stringId="patientPortal.registration.continue"
              fallback="Continue to log in"
            />
          </Button>
        </>
      )}
    </Card>
  );
};
