import React, { useMemo } from 'react';
import { Box, Divider, Typography, styled } from '@mui/material';
import { useLocation, useNavigate } from 'react-router';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { Button, TAMANU_COLORS } from '@tamanu/ui-components';
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

const getErrorMessage = (error: unknown) => {
  const maybeProblem = error as { type?: string; status?: number } | undefined;
  if (maybeProblem?.type === ERROR_TYPE.AUTH_CREDENTIAL_INVALID && maybeProblem.status === 401) {
    return 'Invalid verification code';
  }
  if (maybeProblem?.type === ERROR_TYPE.AUTH_TOKEN_INVALID && maybeProblem.status === 401) {
    return 'Verification code has expired';
  }
  return 'An error occurred while logging in';
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
        Email sent to {maskedEmail}
      </Typography>
    </EmailSectionContainer>
  );
};

export const LoginView = () => {
  const { mutate: login, error: loginError, reset: resetLogin } = useLogin();
  const location = useLocation();
  const navigate = useNavigate();

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
        <ShieldIcon fontSize="small" sx={{ color: TAMANU_COLORS.blue }} />
        <Typography variant="h3">Account authentication</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" style={{ textWrap: 'balance' }}>
        If there is an account associated with the email address provided you will receive a 6-digit
        verification code.
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ my: 3 }}>
          {storedEmail ? (
            <EmailSection email={storedEmail} />
          ) : (
            <TextField
              label="Email Address"
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
          Enter 6-digit verification code
        </Typography>
        <Box sx={{ mb: 3 }}>
          <VerificationCodeInput
            name="verificationCode"
            error={!!loginError}
            helperText={loginError ? getErrorMessage(loginError) : ''}
            onFocus={() => {
              if (!loginError) return;
              // Reset error state when the input is re-focused after submitting
              resetLogin();
            }}
          />
        </Box>
        <Button type="submit" fullWidth variant="contained">
          Log in
        </Button>
      </form>
      <Divider sx={{ my: 2 }} />
      <Button onClick={() => navigate('/login')} variant="text">
        Back to login
      </Button>
    </Card>
  );
};
