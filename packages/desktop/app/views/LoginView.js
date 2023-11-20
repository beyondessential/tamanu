import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import Paper from '@material-ui/core/Paper';
import { push } from 'connected-react-router';
import { Launch } from '@material-ui/icons';

import { TamanuLogo } from '../components';
import { LOCAL_STORAGE_KEYS, Colors } from '../constants';
import { splashImages } from '../constants/images';

import { LoginForm } from '../forms/LoginForm';
import { ResetPasswordForm } from '../forms/ResetPasswordForm';
import { ChangePasswordForm } from '../forms/ChangePasswordForm';
import {
  changePassword,
  login,
  requestPasswordReset,
  restartPasswordResetFlow,
  clearPatient,
} from '../store';
import { useApi } from '../api';

import { SyncHealthNotificationComponent } from '../components/SyncHealthNotification';

import { useLocalisation } from '../contexts/Localisation';

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
  position: relative;
  padding: 30px 60px 70px 60px;
  width: 480px;
`;

const LogoContainer = styled.div`
  text-align: center;
`;

const SupportDesktopLink = styled.a`
  position: absolute;
  bottom: 17px;
  right: 28px;
  margin-top: 4px;
  font-weight: 400;
  font-size: 9px;
  line-height: 15px;
  text-decoration: underline;
  color: ${Colors.darkestText};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    font-weight: bold;
  }
`;

export const LoginView = () => {
  const api = useApi();
  const dispatch = useDispatch();
  const loginError = useSelector(state => state.auth.error);
  const requestPasswordResetError = useSelector(state => state.auth.resetPassword.error);
  const requestPasswordResetSuccess = useSelector(state => state.auth.resetPassword.success);
  const resetPasswordEmail = useSelector(state => state.auth.resetPassword.lastEmailUsed);
  const changePasswordError = useSelector(state => state.auth.changePassword.error);
  const changePasswordSuccess = useSelector(state => state.auth.changePassword.success);
  const { getLocalisation } = useLocalisation();

  const rememberEmail = localStorage.getItem(REMEMBER_EMAIL);

  const [screen, setScreen] = useState('login');

  const supportUrl = getLocalisation('supportDeskUrl');

  const submitLogin = async data => {
    const { host, email, password, rememberMe } = data;

    // If a different user logs in, reset patient state and navigate to index
    if (email !== api.user?.email) {
      dispatch(clearPatient());
      dispatch(push('/'));
    }

    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL);
    }

    // The await is necessary to prevent redux-form unlocking submission
    // redux-thunk definitely returns a promise, and this works
    await dispatch(login(host, email, password));
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
            onSubmit={submitLogin}
            errorMessage={loginError}
            rememberEmail={rememberEmail}
            onNavToResetPassword={() => setScreen('resetPassword')}
          />
        )}
        {screen === 'resetPassword' && (
          <ResetPasswordForm
            onSubmit={({ host, email }) => dispatch(requestPasswordReset(host, email))}
            onRestartFlow={() => dispatch(restartPasswordResetFlow())}
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
            onSubmit={data => dispatch(changePassword(data))}
            errorMessage={changePasswordError}
            success={changePasswordSuccess}
            email={resetPasswordEmail}
            onNavToLogin={() => setScreen('login')}
            onNavToResetPassword={() => setScreen('resetPassword')}
          />
        )}
        <SupportDesktopLink href={supportUrl} target="_blank" rel="noreferrer">
          Support centre
          <Launch style={{ marginLeft: '3px', fontSize: '12px' }} />
        </SupportDesktopLink>
      </LoginContainer>
    </Grid>
  );
};
