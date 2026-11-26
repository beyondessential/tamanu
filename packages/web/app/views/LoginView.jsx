import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getResetPasswordErrorMessage } from '@tamanu/errors';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';
import { LoginForm } from '../forms/LoginForm';
import { ResetPasswordForm } from '../forms/ResetPasswordForm';
import { ChangePasswordForm } from '../forms/ChangePasswordForm';

import { AuthFlowView } from './AuthFlowView';
const { REMEMBER_EMAIL } = LOCAL_STORAGE_KEYS;

// The forms show a failed request from its mutation's error, so a submission settles either way.
const ignoreRejection = () => {};

export const LoginView = () => {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, authError: loginError, lastUserEmail } = useAuth();

  const changePassword = useMutation({ mutationFn: data => api.changePassword(data) });
  const requestPasswordReset = useMutation({
    mutationFn: email => api.requestPasswordReset(email),
    // The change password step starts afresh for each code sent
    onSuccess: () => changePassword.reset(),
  });
  const requestPasswordResetError =
    requestPasswordReset.error && getResetPasswordErrorMessage(requestPasswordReset.error);
  const resetPasswordEmail = requestPasswordReset.isSuccess ? requestPasswordReset.variables : null;

  const rememberEmail = window?.localStorage?.getItem(REMEMBER_EMAIL);

  const [screen, setScreen] = useState('login');
  const submitLogin = async data => {
    const { email, password, rememberMe } = data;

    // If a different user logs in, clear cached data and navigate to index.
    // Keep the serverAlive query, otherwise the app treats the server as down.
    if (email !== lastUserEmail) {
      queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== 'serverAlive' });
      navigate('/');
    }

    const success = await login(email, password);
    if (rememberMe) {
      // Only remember the email on a successful login, otherwise the
      // LoginForm header would flip to "Welcome back" before the auth
      // result is known.
      if (success) window?.localStorage?.setItem(REMEMBER_EMAIL, email);
    } else {
      // Honour the unchecked preference even on failure: forgetting a
      // saved email doesn't require a successful auth.
      window?.localStorage?.removeItem(REMEMBER_EMAIL);
    }
  };

  return (
    <AuthFlowView data-testid="authflowview-7rqa">
      {screen === 'login' && (
        <LoginForm
          onSubmit={submitLogin}
          errorMessage={loginError}
          rememberEmail={rememberEmail}
          onNavToResetPassword={() => {
            setScreen('resetPassword');
            requestPasswordReset.reset();
          }}
          data-testid="loginform-fp20"
        />
      )}
      {screen === 'resetPassword' && (
        <ResetPasswordForm
          onSubmit={({ email }) => requestPasswordReset.mutateAsync(email).catch(ignoreRejection)}
          onRestartFlow={requestPasswordReset.reset}
          errorMessage={requestPasswordResetError}
          success={requestPasswordReset.isSuccess}
          initialEmail={rememberEmail}
          resetPasswordEmail={resetPasswordEmail}
          onNavToChangePassword={() => setScreen('changePassword')}
          onNavToLogin={() => setScreen('login')}
          data-testid="resetpasswordform-eka3"
        />
      )}
      {screen === 'changePassword' && (
        <ChangePasswordForm
          onSubmit={data => changePassword.mutateAsync(data).catch(ignoreRejection)}
          onRestartFlow={requestPasswordReset.reset}
          errorMessage={changePassword.error?.message}
          success={changePassword.isSuccess}
          email={resetPasswordEmail}
          onNavToLogin={() => {
            setScreen('login');
          }}
          onNavToResetPassword={() => setScreen('resetPassword')}
          onValidateResetCode={data => api.post('changePassword/validate-reset-code', data)}
          data-testid="changepasswordform-2331"
        />
      )}
    </AuthFlowView>
  );
};
