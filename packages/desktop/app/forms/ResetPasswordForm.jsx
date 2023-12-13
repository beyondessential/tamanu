import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { Button, Field, Form, StyledPrimarySubmitButton, TextField } from '../components';
import { FormGrid } from '../components/FormGrid';

const SuccessMessage = styled.p`
  margin-top: 0;
`;

export const ResetPasswordForm = React.memo(
  ({
    onSubmit,
    errorMessage,
    success,
    initialEmail,
    resetPasswordEmail,
    onRestartFlow,
    onNavToChangePassword,
    onNavToLogin,
  }) => {
    const renderForm = () => (
      <FormGrid columns={1}>
        <h3>Reset Password</h3>
        <div>Enter your account email</div>
        <div>{errorMessage}</div>
        <Field name="email" type="email" label="Email" required component={TextField} />
        <StyledPrimarySubmitButton text="Reset Password" />
        <Button onClick={onNavToLogin} color="default" variant="text">
          Back
        </Button>
      </FormGrid>
    );

    if (success) {
      return (
        <FormGrid columns={1}>
          <h3>Reset Password</h3>
          <SuccessMessage>
            An email with instructions has been sent to <strong>{resetPasswordEmail}</strong>
            . If you do not receive this email within a few minutes please try again.
          </SuccessMessage>
          <Button fullWidth variant="contained" color="primary" onClick={onNavToChangePassword}>
            Continue
          </Button>
          <Button onClick={onRestartFlow}>Resend password reset email</Button>
          <Button onClick={onNavToLogin}>Back</Button>
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
