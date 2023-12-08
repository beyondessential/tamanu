import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import Paper from '@material-ui/core/Paper';
import { push } from 'connected-react-router';
import { Launch } from '@material-ui/icons';

import { Colors, LOCAL_STORAGE_KEYS } from '../constants';
import { BodyText, TamanuLogo, TamanuLogoBlue } from '../components';
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
import { Typography } from '@material-ui/core';
import { theme } from '../theme';

const { REMEMBER_EMAIL } = LOCAL_STORAGE_KEYS;

const Grid = styled.div`
  display: grid;
  height: 100vh;
  justify-content: flex-start;
  align-items: center;
  background-image: url(${splashImages[3]});
  background-repeat: no-repeat;
  background-size: 50%;
  background-position: center right;
`;

const LoginContainer = styled(Paper)`
  position: relative;
  padding: 30px 60px 70px 60px;
  width: 50vw;
  height: inherit;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoContainer = styled.div`
  text-align: center;
  position: fixed;
  top: 0;
  left: 0;
  padding: 30px;
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

const LoginFormContainer = styled.div`
  max-width: 372px;
  width: 100%;
`;

const LoginHeading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
`;

const LoginSubtext = styled(BodyText)`
  color: ${Colors.midText};
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
  const isSupportUrlLoaded = !!supportUrl;

  const submitLogin = async data => {
    const { email, password, rememberMe } = data;

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
    await dispatch(login(email, password));
  };

  return (
    <Grid>
      <LoginContainer>
        <SyncHealthNotificationComponent />
        <LogoContainer>
          <TamanuLogoBlue size="150px" />
        </LogoContainer>
        <LoginFormContainer>
          <LoginHeading>Log in</LoginHeading>
          <LoginSubtext>Enter your details below to log in</LoginSubtext>
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
              onSubmit={({ email }) => dispatch(requestPasswordReset(email))}
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
        </LoginFormContainer>
        {isSupportUrlLoaded && (
          <SupportDesktopLink href={supportUrl} target="_blank" rel="noreferrer">
            Support centre
            <Launch style={{ marginLeft: '3px', fontSize: '12px' }} />
          </SupportDesktopLink>
        )}
      </LoginContainer>
    </Grid>
  );
};
