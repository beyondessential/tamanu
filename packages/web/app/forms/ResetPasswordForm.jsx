import React, { useEffect } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { FormGrid } from '../components/FormGrid';
import {
  BodyText,
  Button,
  Field,
  Form,
  FormSubmitButton,
  TextButton,
  TextField,
} from '../components';
import { Colors } from '../constants';

const ResetPasswordButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 14px 0;
  margin-top: 30px;
`;

const BackToLoginButton = styled(Button)`
  padding: 14px 0;
  margin-top: 5px;
`;

const FormHeading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
`;

const FormSubtext = styled(BodyText)`
  color: ${Colors.midText};
  padding: 10px 0;
`;

const ResetPasswordFormComponent = ({ errorMessage, onNavToLogin, setFieldError }) => {
  return (
    <FormGrid columns={1}>
      <div>
        <FormHeading>Forgot Password</FormHeading>
        <FormSubtext>Enter your email address below and we will send you a reset code.</FormSubtext>
        {!!errorMessage && <FormSubtext>{errorMessage}</FormSubtext>}
      </div>
      <Field
        name="email"
        type="email"
        label="Email"
        required
        component={TextField}
        placeholder="Enter your email address"
      />
      <ResetPasswordButton text="Send reset code" />
      <BackToLoginButton onClick={onNavToLogin} variant="outlined">
        Back to login
      </BackToLoginButton>
    </FormGrid>
  );
};

export const ResetPasswordForm = React.memo(
  ({ onSubmit, errorMessage, success, initialEmail, onNavToChangePassword, onNavToLogin }) => {
    const renderForm = ({ setFieldError }) => (
      <ResetPasswordFormComponent
        errorMessage={errorMessage}
        onNavToLogin={onNavToLogin}
        setFieldError={setFieldError}
      />
    );

    if (success) {
      onNavToChangePassword();
    }

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        initialValues={{
          email: initialEmail,
        }}
        validationSchema={yup.object().shape({
          email: yup
            .string()
            .email('Must enter a valid email')
            .required('*Required'),
        })}
        suppressErrorDialog
      />
    );
  },
);
