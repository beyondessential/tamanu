import React, { memo, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import styled from 'styled-components';
import Paper from '@material-ui/core/Paper';

import * as yup from 'yup';
import { Button, MinusIconButton, PlusIconButton, TamanuLogo } from '../components';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { splashImages } from '../constants/images';

import { LoginForm } from '../forms/LoginForm';
import { ResetPasswordForm } from '../forms/ResetPasswordForm';
import { ChangePasswordForm } from '../forms/ChangePasswordForm';
import {
  changePassword,
  checkIsLoggedIn,
  login,
  requestPasswordReset,
  restartPasswordResetFlow,
} from '../store';

import { SyncHealthNotificationComponent } from '../components/SyncHealthNotification';

const { REMEMBER_EMAIL } = LOCAL_STORAGE_KEYS;

const Grid = styled.div`
  display: grid;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background-image: url(${splashImages[1]});
  background-repeat: no-repeat;
  background-size: cover;
`;

const LoginContainer = styled(Paper)`
  padding: 30px 60px 70px 60px;
  width: 480px;
`;

const LogoContainer = styled.div`
  text-align: center;
`;

export const LoginView = memo(
  ({
    onLogin,
    loginError,
    onRequestPasswordReset,
    requestPasswordResetError,
    requestPasswordResetSuccess,
    resetPasswordEmail,
    onRestartResetPasswordFlow,
    onChangePassword,
    changePasswordError,
    changePasswordSuccess,
  }) => {
    const rememberEmail = localStorage.getItem(REMEMBER_EMAIL);

    const [screen, setScreen] = useState('login');

    const onSubmitLogin = data => {
      const { host, email, password, rememberMe } = data;

      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL);
      }

      onLogin({ host, email, password });
    };

    const onSubmit = data => {
      const { host, email, password, rememberMe } = data;

      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL);
      }

      onLogin({ host, email, password });
    };

    return (
      <Grid>
        <LoginContainer>
          <SyncHealthNotificationComponent />
          <LogoContainer>
            <TamanuLogo size="150px" />
          </LogoContainer>
          {screen === 'login' && (
            <LoginForm
              onSubmit={onSubmitLogin}
              errorMessage={loginError}
              rememberEmail={rememberEmail}
              onNavToResetPassword={() => setScreen('resetPassword')}
            />
          )}
          {screen === 'resetPassword' && (
            <ResetPasswordForm
              onSubmit={onRequestPasswordReset}
              onRestartFlow={onRestartResetPasswordFlow}
              errorMessage={requestPasswordResetError}
              success={requestPasswordResetSuccess}
              initialEmail={rememberEmail}
              resetPasswordEmail={resetPasswordEmail}
              onNavToChangePassword={() => setScreen('changePassword')}
              onNavToLogin={() => setScreen('login')}
            />
          )}
          {screen === 'changePassword' && (
            <ChangePasswordForm
              onSubmit={onChangePassword}
              errorMessage={changePasswordError}
              success={changePasswordSuccess}
              email={resetPasswordEmail}
              onNavToLogin={() => setScreen('login')}
              onNavToResetPassword={() => setScreen('resetPassword')}
            />
          )}
        </LoginContainer>
      </Grid>
    );
  }
);

const mapStateToProps = state => ({
  loginError: state.auth.error,
  requestPasswordResetError: state.auth.resetPassword.error,
  requestPasswordResetSuccess: state.auth.resetPassword.success,
  resetPasswordEmail: state.auth.resetPassword.lastEmailUsed,
  changePasswordError: state.auth.changePassword.error,
  changePasswordSuccess: state.auth.changePassword.success,
});

const mapDispatchToProps = dispatch => ({
  onLogin: ({ host, email, password }) => {
    dispatch(login(host, email, password));
  },
  onRequestPasswordReset: ({ host, email }) => {
    dispatch(requestPasswordReset(host, email));
  },
  onRestartResetPasswordFlow: () => {
    dispatch(restartPasswordResetFlow());
  },
  onChangePassword: data => {
    dispatch(changePassword(data));
  },
});

export const ConnectedLoginView = connect(mapStateToProps, mapDispatchToProps)(LoginView);
