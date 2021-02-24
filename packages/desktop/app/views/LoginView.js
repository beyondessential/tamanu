import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Paper } from '@material-ui/core';
import * as yup from 'yup';
import { Button, TamanuLogo } from '../components';
import { REMEMBER_EMAIL_KEY } from '../constants';
import { splashImages } from '../constants/images';

import { Form, Field, TextField, CheckField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';

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

export class LoginView extends Component {
  onSubmit = data => {
    const { onLogin } = this.props;
    const { email, password, rememberMe } = data;

    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }

    onLogin({ email, password });
  };

  renderForm = ({ submitForm }) => {
    const { errorMessage } = this.props;

    return (
      <FormGrid columns={1}>
        <div>{errorMessage}</div>
        <Field name="email" type="email" label="Email" required component={TextField} />
        <Field name="password" label="Password" type="password" required component={TextField} />
        <Field name="rememberMe" label="Remember me" component={CheckField} />
        <LoginButton fullWidth variant="contained" color="primary" type="submit">
          Login to your account v1.0.0
        </LoginButton>
      </FormGrid>
    );
  };

  render() {
    const rememberEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

    return (
      <Grid>
        <LoginContainer>
          <LogoContainer>
            <TamanuLogo size="150px" />
          </LogoContainer>
          <Form
            onSubmit={this.onSubmit}
            render={this.renderForm}
            initialValues={{
              email: rememberEmail,
              rememberMe: !!rememberEmail,
            }}
            validationSchema={yup.object().shape({
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
  }
}

export const ConnectedLoginView = connect(state => ({ errorMessage: state.auth.error }))(LoginView);
