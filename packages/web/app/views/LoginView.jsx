import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { getResetPasswordErrorMessage } from '@tamanu/errors';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';
import { LoginForm } from '../forms/LoginForm';
import { ResetPasswordForm } from '../forms/ResetPasswordForm';
import { ChangePasswordForm } from '../forms/ChangePasswordForm';

import { AuthFlowView } from './AuthFlowView';
const { REMEMBER_EMAIL } = LOCAL_STORAGE_KEYS;

const INITIAL_RESET_PASSWORD = { success: false, error: null, lastEmailUsed: null };
const INITIAL_CHANGE_PASSWORD = { success: false, error: null };

export const LoginView = () => {
  const api = useApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login, authError: loginError, lastUserEmail } = useAuth();

  const [resetPassword, setResetPassword] = useState(INITIAL_RESET_PASSWORD);
  const [changePassword, setChangePassword] = useState(INITIAL_CHANGE_PASSWORD);

  const restartPasswordResetFlow = () => setResetPassword(INITIAL_RESET_PASSWORD);

  const requestPasswordReset = async email => {
    setResetPassword(INITIAL_RESET_PASSWORD);
    try {
      await api.requestPasswordReset(email);
      setResetPassword({ ...INITIAL_RESET_PASSWORD, success: true, lastEmailUsed: email });
      // The change password step starts afresh for each code sent
      setChangePassword(INITIAL_CHANGE_PASSWORD);
    } catch (error) {
      setResetPassword({ ...INITIAL_RESET_PASSWORD, error: getResetPasswordErrorMessage(error) });
    }
  };

  const submitChangePassword = async data => {
    setChangePassword(INITIAL_CHANGE_PASSWORD);
    try {
      await api.changePassword(data);
      setResetPassword(INITIAL_RESET_PASSWORD);
      setChangePassword({ ...INITIAL_CHANGE_PASSWORD, success: true });
    } catch (error) {
      setChangePassword({ ...INITIAL_CHANGE_PASSWORD, error: error.message });
    }
  };

  const validateResetCode = async data => {
    await api.post('changePassword/validate-reset-code', data);
  };

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
    restartPasswordResetFlow();
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
            restartPasswordResetFlow();
          }}
          data-testid="loginform-fp20"
        />
      )}
      {screen === 'resetPassword' && (
        <ResetPasswordForm
          onSubmit={({ email }) => requestPasswordReset(email)}
          onRestartFlow={restartPasswordResetFlow}
          errorMessage={resetPassword.error}
          success={resetPassword.success}
          initialEmail={rememberEmail}
          resetPasswordEmail={resetPassword.lastEmailUsed}
          onNavToChangePassword={() => setScreen('changePassword')}
          onNavToLogin={() => setScreen('login')}
          data-testid="resetpasswordform-eka3"
        />
      )}
      {screen === 'changePassword' && (
        <ChangePasswordForm
          onSubmit={submitChangePassword}
          onRestartFlow={restartPasswordResetFlow}
          errorMessage={changePassword.error}
          success={changePassword.success}
          email={resetPassword.lastEmailUsed}
          onNavToLogin={() => {
            setScreen('login');
          }}
          onNavToResetPassword={() => setScreen('resetPassword')}
          onValidateResetCode={validateResetCode}
          data-testid="changepasswordform-2331"
        />
      )}
    </AuthFlowView>
  );
};
