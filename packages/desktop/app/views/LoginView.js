import React, { memo, useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Collapse from '@material-ui/core/Collapse';
import Paper from '@material-ui/core/Paper';
import * as yup from 'yup';
import { Button, MinusIconButton, PlusIconButton, TamanuLogo } from '../components';
import { REMEMBER_EMAIL_KEY } from '../constants';
import { splashImages } from '../constants/images';

import { Form, Field, TextField, CheckField, ServerDetectingField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
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

const LoginButton = styled(Button)`
  font-size: 16px;
  line-height: 18px;
  padding-top: 16px;
  padding-bottom: 16px;
`;

const RememberMeAdvancedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
`;

const AdvancedButtonSpan = styled.span`
  .MuiButtonBase-root {
    padding: 0px 0px 0px 9px;
    font-size: 20px;
  }
`;

export const LoginView = memo(({ errorMessage, onLogin }) => {
  const [isAdvancedExpanded, setAdvancedExpanded] = useState(false);

  const onSubmit = data => {
    const { host, email, password, rememberMe } = data;

    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }

    onLogin({ host, email, password });
  };

  const onError = errors => {
    if (errors.host) {
      setAdvancedExpanded(true);
    }
  };

  const renderForm = ({ setFieldValue }) => {
    return (
      <FormGrid columns={1}>
        <div>{errorMessage}</div>
        <Field name="email" type="email" label="Email" required component={TextField} />
        <Field name="password" label="Password" type="password" required component={TextField} />
        <RememberMeAdvancedRow>
          <Field name="rememberMe" label="Remember me" component={CheckField} />
          <AdvancedButtonSpan>
            Advanced
            {isAdvancedExpanded ? (
              <MinusIconButton
                onClick={() => setAdvancedExpanded(false)}
                styles={{ padding: '0px' }}
              />
            ) : (
              <PlusIconButton onClick={() => setAdvancedExpanded(true)} />
            )}
          </AdvancedButtonSpan>
        </RememberMeAdvancedRow>
        <Collapse in={isAdvancedExpanded}>
          <Field
            name="host"
            label="LAN Server Address"
            required
            component={ServerDetectingField}
            setFieldValue={setFieldValue}
          />
        </Collapse>
        <LoginButton fullWidth variant="contained" color="primary" type="submit">
          Login to your account
        </LoginButton>
      </FormGrid>
    );
  };

  const rememberEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

  return (
    <Grid>
      <LoginContainer>
        <SyncHealthNotificationComponent />
        <LogoContainer>
          <TamanuLogo size="150px" />
        </LogoContainer>
        <Form
          onSubmit={onSubmit}
          onError={onError}
          render={renderForm}
          initialValues={{
            email: rememberEmail,
            rememberMe: !!rememberEmail,
          }}
          validationSchema={yup.object().shape({
            host: yup.string().required(),
            email: yup
              .string()
              .email('Must enter a valid email')
              .required(),
            password: yup.string().required(),
          })}
        />
      </LoginContainer>
    </Grid>
  );
});

export const ConnectedLoginView = connect(state => ({ errorMessage: state.auth.error }))(LoginView);
