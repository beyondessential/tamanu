import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { FormGrid } from '../components/FormGrid';
import { Button, CheckField, Field, Form, FormSubmitButton, TextField } from '../components';

const LoginButton = styled(FormSubmitButton)`
  font-size: 16px;
  line-height: 18px;
  padding-top: 16px;
  padding-bottom: 16px;
`;

const RememberMeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  text-align: center;
`;

const LoginFormComponent = ({ errorMessage, onNavToResetPassword }) => (
  <FormGrid columns={1}>
    {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    <Field name="email" type="email" label="Email" required component={TextField} />
    <Field name="password" label="Password" type="password" required component={TextField} />
    <RememberMeRow>
      <Field name="rememberMe" label="Remember me" component={CheckField} />
    </RememberMeRow>
    <LoginButton text="Login to your account" />
    <Button onClick={onNavToResetPassword} color="default" variant="text">
      Forgot your password?
    </Button>
  </FormGrid>
);

export const LoginForm = React.memo(
  ({ onSubmit, errorMessage, rememberEmail, onNavToResetPassword }) => {
    const [isAdvancedExpanded, setAdvancedExpanded] = useState(false);

    const onError = errors => {
      if (errors.host) {
        setAdvancedExpanded(true);
      }
    };

    const renderForm = ({ setFieldValue, setFieldError }) => (
      <LoginFormComponent
        errorMessage={errorMessage}
        isAdvancedExpanded={isAdvancedExpanded}
        setAdvancedExpanded={setAdvancedExpanded}
        setFieldValue={setFieldValue}
        onNavToResetPassword={onNavToResetPassword}
        setFieldError={setFieldError}
      />
    );

    return (
      <Form
        onSubmit={onSubmit}
        onError={onError}
        render={renderForm}
        initialValues={{
          email: rememberEmail,
          rememberMe: !!rememberEmail,
        }}
        validationSchema={yup.object().shape({
          email: yup
            .string()
            .email('Must enter a valid email')
            .nullable()
            .required(),
          password: yup.string().required(),
        })}
      />
    );
  },
);
