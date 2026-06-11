import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { LoginForm } from '../forms/LoginForm';
import { MfaInviteForm } from '../forms/MfaInviteForm';
import { MfaLoginForm } from '../forms/MfaLoginForm';
import { ResetPasswordForm } from '../forms/ResetPasswordForm';
import { ChangePasswordForm } from '../forms/ChangePasswordForm';
import {
  changePassword,
  clearPatient,
  getMfaPending,
  login,
  requestPasswordReset,
  restartPasswordResetFlow,
  validateResetCode,
} from '../store';
import { useApi } from '../api';

import { AuthFlowView } from './AuthFlowView';
const { REMEMBER_EMAIL } = LOCAL_STORAGE_KEYS;

export const LoginView = () => {
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loginError = useSelector(state => state.auth.error);
  const requestPasswordResetError = useSelector(state => state.auth.resetPassword.error);
  const requestPasswordResetSuccess = useSelector(state => state.auth.resetPassword.success);
  const resetPasswordEmail = useSelector(state => state.auth.resetPassword.lastEmailUsed);
  const changePasswordError = useSelector(state => state.auth.changePassword.error);
  const changePasswordSuccess = useSelector(state => state.auth.changePassword.success);
  const mfaPending = useSelector(getMfaPending);

  const rememberEmail = localStorage.getItem(REMEMBER_EMAIL);

  const [screen, setScreen] = useState('login');
  const submitLogin = async data => {
    const { email, password, rememberMe } = data;

    // If a different user logs in, reset patient state and navigate to index
    if (email !== api.user?.email) {
      dispatch(clearPatient());
      navigate('/');
    }

    const success = await dispatch(login(email, password));
    if (rememberMe) {
      // Only remember the email on a successful login, otherwise the
      // LoginForm header would flip to "Welcome back" before the auth
      // result is known.
      if (success) localStorage.setItem(REMEMBER_EMAIL, email);
    } else {
      // Honour the unchecked preference even on failure: forgetting a
      // saved email doesn't require a successful auth.
      localStorage.removeItem(REMEMBER_EMAIL);
    }
    dispatch(restartPasswordResetFlow());
  };

  // a paused login takes over the view until the second factor is satisfied
  // (or cancelled), regardless of which screen we came from
  if (mfaPending) {
    return (
      <AuthFlowView data-testid="authflowview-7rqa">
        <MfaLoginForm data-testid="mfaloginform-9b1a" />
      </AuthFlowView>
    );
  }

  return (
    <AuthFlowView data-testid="authflowview-7rqa">
      {screen === 'login' && (
        <LoginForm
          onSubmit={submitLogin}
          errorMessage={loginError}
          rememberEmail={rememberEmail}
          onNavToResetPassword={() => {
            setScreen('resetPassword');
            dispatch(restartPasswordResetFlow());
          }}
          onNavToMfaInvite={() => setScreen('mfaInvite')}
          data-testid="loginform-fp20"
        />
      )}
      {screen === 'mfaInvite' && (
        <MfaInviteForm
          onNavToLogin={() => setScreen('login')}
          initialEmail={rememberEmail}
          data-testid="mfainviteform-x1k2"
        />
      )}
      {screen === 'resetPassword' && (
        <ResetPasswordForm
          onSubmit={({ email }) => dispatch(requestPasswordReset(email))}
          onRestartFlow={() => dispatch(restartPasswordResetFlow())}
          errorMessage={requestPasswordResetError}
          success={requestPasswordResetSuccess}
          initialEmail={rememberEmail}
          resetPasswordEmail={resetPasswordEmail}
          onNavToChangePassword={() => setScreen('changePassword')}
          onNavToLogin={() => setScreen('login')}
          data-testid="resetpasswordform-eka3"
        />
      )}
      {screen === 'changePassword' && (
        <ChangePasswordForm
          onSubmit={data => dispatch(changePassword(data))}
          onRestartFlow={() => dispatch(restartPasswordResetFlow())}
          errorMessage={changePasswordError}
          success={changePasswordSuccess}
          email={resetPasswordEmail}
          onNavToLogin={() => {
            setScreen('login');
          }}
          onNavToResetPassword={() => setScreen('resetPassword')}
          onValidateResetCode={data => dispatch(validateResetCode(data))}
          data-testid="changepasswordform-2331"
        />
      )}
    </AuthFlowView>
  );
};
