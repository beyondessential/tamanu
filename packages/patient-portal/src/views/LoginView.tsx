import React, { useMemo, useRef } from 'react';
import { Box, Divider, Typography, styled } from '@mui/material';
import { useLocation, useNavigate } from 'react-router';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { Button, TAMANU_COLORS, TranslatedText, useTranslation } from '@tamanu/ui-components';
import { ERROR_TYPE } from '@tamanu/errors';
import { useLogin } from '@api/mutations';
import { TextField } from '@components/TextField';
import { Card } from '@components/Card';
import { VerificationCodeInput } from '@components/VerificationCodeInput';

const EmailSectionContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  backgroundColor: '#E8F1FB',
  padding: 16,
  borderRadius: 8,
  border: `1px solid ${TAMANU_COLORS.blue}`,
});

const LoginErrorMessage = ({ error }: { error: unknown }) => {
  const maybeProblem = error as { type?: string; status?: number } | undefined;
  if (maybeProblem?.type === ERROR_TYPE.AUTH_CREDENTIAL_INVALID && maybeProblem.status === 401) {
    return (
      <TranslatedText
        stringId="patientPortal.login.error.invalidCode"
        fallback="Invalid verification code"
      />
    );
  }
  if (maybeProblem?.type === ERROR_TYPE.AUTH_TOKEN_INVALID && maybeProblem.status === 401) {
    return (
      <TranslatedText
        stringId="patientPortal.login.error.expiredCode"
        fallback="Verification code has expired"
      />
    );
  }
  return (
    <TranslatedText
      stringId="patientPortal.login.error.generic"
      fallback="An error occurred while logging in"
    />
  );
};

/**
 * Mask the email address so that the last characters of the local part are visible.
 * Visible characters range from 0 (in the case of a single character) and a maximum of 3.
 *
 * @example
 * maskEmail('maa@gmail.com') // returns **a@gmail.com
 * maskEmail('abcd@gmail.com') // returns **cd@gmail.com
 * maskEmail('abcdefghijk@gmail.com') // returns ********ijk@gmail.com
 */
const maskEmail = (email: string) => {
  return email.replace(/(.+?.?)(.{0,3}@.*)/, (_match, p1, p2) => `${'*'.repeat(p1.length)}${p2}`);
};

const EmailSection = ({ email }: { email: string }) => {
  const maskedEmail = useMemo(() => maskEmail(email), [email]);
  return (
    <EmailSectionContainer>
      <MarkEmailReadIcon fontSize="small" style={{ color: TAMANU_COLORS.blue }} />
      <Typography fontWeight={500} variant="body1">
        <TranslatedText
          stringId="patientPortal.login.emailSentTo"
          fallback="Email sent to :email"
          replacements={{ email: maskedEmail }}
        />
      </Typography>
    </EmailSectionContainer>
  );
};

export const LoginView = () => {
  const { mutate: login, error: loginError, reset: resetLogin, isPending } = useLogin();
  const location = useLocation();
  const navigate = useNavigate();
  const { getTranslation } = useTranslation();

  const storedEmail = location.state?.email;
  const isSigningIn = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // A code works once, so a second tap while signing in would only fail
    if (isSigningIn.current) return;
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const loginToken = formData.get('verificationCode') as string | null;

    const email = storedEmail || (formData.get('email') as string | null);

    if (loginToken && email) {
      isSigningIn.current = true;
      login(
        { loginToken: loginToken.trim(), email: email.trim() },
        {
          onSettled: () => {
            isSigningIn.current = false;
          },
        },
      );
    }
  };

  return (
    <Card>
      <Box display="flex" alignItems="center" justifyContent="center" gap={0.75} mb={1}>
        <ShieldIcon fontSize="small" sx={{ color: TAMANU_COLORS.blue }} />
        <Typography variant="h3">
          <TranslatedText
            stringId="patientPortal.login.authentication.title"
            fallback="Account authentication"
          />
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" style={{ textWrap: 'balance' }}>
        <TranslatedText
          stringId="patientPortal.login.authentication.text"
          fallback="If there is an account associated with the email address provided you will receive a 6-digit verification code."
        />
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ my: 3 }}>
          {storedEmail ? (
            <EmailSection email={storedEmail} />
          ) : (
            <TextField
              label={getTranslation('general.localisedField.email.label', 'Email address')}
              fullWidth
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              autoFocus
            />
          )}
        </Box>
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
          <TranslatedText
            stringId="patientPortal.login.enterCode"
            fallback="Enter 6-digit verification code"
          />
        </Typography>
        <Box sx={{ mb: 3 }}>
          <VerificationCodeInput
            name="verificationCode"
            error={!!loginError}
            helperText={loginError ? <LoginErrorMessage error={loginError} /> : ''}
            onFocus={() => {
              if (!loginError) return;
              // Reset error state when the input is re-focused after submitting
              resetLogin();
            }}
          />
        </Box>
        <Button type="submit" fullWidth variant="contained" disabled={isPending}>
          <TranslatedText stringId="patientPortal.login.title" fallback="Log in" />
        </Button>
      </form>
      <Divider sx={{ my: 2 }} />
      <Button onClick={() => navigate('/login')} variant="text">
        <TranslatedText stringId="patientPortal.login.back" fallback="Back to login" />
      </Button>
    </Card>
  );
};
