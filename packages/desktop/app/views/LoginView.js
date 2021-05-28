import React, { memo, useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Paper from '@material-ui/core/Paper';
import { TamanuLogo } from '../components';
import { REMEMBER_EMAIL_KEY } from '../constants';
import { splashImages } from '../constants/images';
import { LoginForm } from '../forms/LoginForm';
import { SyncHealthNotificationComponent } from '../components/SyncHealthNotification';

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

export const LoginView = memo(({ errorMessage, onLogin }) => {
  const rememberEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

  const onSubmit = data => {
    const { host, email, password, rememberMe } = data;

    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
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
        <LoginForm onSubmit={onSubmit} errorMessage={errorMessage} rememberEmail={rememberEmail}/>
      </LoginContainer>
    </Grid>
  );
});

export const ConnectedLoginView = connect(state => ({ errorMessage: state.auth.error }))(LoginView);
