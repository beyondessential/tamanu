import React, { Component } from 'react';
import styled from 'styled-components';
import { Paper } from '@material-ui/core';
import { TextInput, Button, CheckInput, TamanuLogo } from '../components';
import { REMEMBER_EMAIL_KEY } from '../constants';
import { splashImages } from '../constants/images';

import { Form, Field, TextField, CheckField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';

import * as yup from 'yup';

const Grid = styled.div`
  display: grid;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background-image: url(${splashImages[1]});
`;

const LoginContainer = styled(Paper)`
  padding: 30px;
  min-width: 400px;
`;

const LogoContainer = styled.div`
  text-align: center;
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
  }

  renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        name="email"
        type="email"
        label="Email"
        required
        component={TextField}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        required
        component={TextField}
      />
      <Field
        name="rememberMe"
        label="Remember me"
        component={CheckField}
      />
      <div>
        <Button fullWidth variant="contained" color="primary" onClick={submitForm}>
          Login
        </Button>
      </div>
    </FormGrid>
  )

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
              email: yup.string().email("Must enter a valid email").required(),
              password: yup.string().required()
            })}
          />
        </LoginContainer>
      </Grid>
    );
  }
}
