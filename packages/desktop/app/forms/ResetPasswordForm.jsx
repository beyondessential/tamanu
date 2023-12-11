import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { FormGrid } from '../components/FormGrid';
import { Button, Field, Form, TextField, FormSubmitButton, BodyText } from '../components';
import { Colors } from '../constants';

const ResetPasswordButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 13px 0;
  margin-top: 30px;
`;

const BackToLoginButton = styled(Button)`
  padding: 13px 0;
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

const ErrorText = styled(BodyText)`
  color: ${Colors.midText};
  padding: 10px 0;
  ${props => (props.$isError ? '' : `display: none;`)}
`;

export const ResetPasswordForm = React.memo(
  ({
    onSubmit,
    errorMessage,
    success,
    initialEmail,
    onRestartFlow,
    onNavToChangePassword,
    onNavToLogin,
  }) => {
    const renderForm = () => (
      <FormGrid columns={1}>
        <div>
          <FormHeading>Forgot password</FormHeading>
          <FormSubtext>
            Enter your email address below and we will send you a reset code.
          </FormSubtext>
          <ErrorText $isError={!!errorMessage}>{errorMessage}</ErrorText>
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

    if (success) {
      return (
        <FormGrid columns={1}>
          <div>
            <FormHeading>Forgot password email sent.</FormHeading>
            <FormSubtext>
              Please check your email for further information on how to reset your password
            </FormSubtext>
          </div>
          <BackToLoginButton onClick={onNavToLogin} variant="outlined">
            Back to login
          </BackToLoginButton>
          <Button fullWidth variant="contained" color="primary" onClick={onNavToChangePassword}>
            Continue to change password
          </Button>
          <Button onClick={onRestartFlow}> Resend password reset email</Button>
        </FormGrid>
      );
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
            .required(),
        })}
      />
    );
  },
);
