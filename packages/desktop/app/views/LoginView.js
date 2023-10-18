import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import Paper from '@material-ui/core/Paper';
import { push } from 'connected-react-router';

import { TamanuLogo } from '../components';
import { LOCAL_STORAGE_KEYS } from '../constants';
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
import { useTranslation } from '../contexts/Translation';

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
  position: relative;
`;

const LogoContainer = styled.div`
  text-align: center;
`;

export const LoginView = () => {
  const api = useApi();
  const dispatch = useDispatch();
  const { setTranslations } = useTranslation();
  const loginError = useSelector(state => state.auth.error);
  const requestPasswordResetError = useSelector(state => state.auth.resetPassword.error);
  const requestPasswordResetSuccess = useSelector(state => state.auth.resetPassword.success);
  const resetPasswordEmail = useSelector(state => state.auth.resetPassword.lastEmailUsed);
  const changePasswordError = useSelector(state => state.auth.changePassword.error);
  const changePasswordSuccess = useSelector(state => state.auth.changePassword.success);

  const rememberEmail = localStorage.getItem(REMEMBER_EMAIL);

  const [screen, setScreen] = useState('login');

  const submitLogin = async data => {
    const { host, email, password, rememberMe, language } = data;

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

    localStorage.setItem('language', language);
    const translations = await api.get(`translation/${language}`);
    setTranslations(translations);
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
      </LoginContainer>
    </Grid>
  );
};
