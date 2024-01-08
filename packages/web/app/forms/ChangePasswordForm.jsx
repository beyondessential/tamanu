import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { FormGrid } from '../components/FormGrid';
import {
  Button,
  Field,
  Form,
  TextField,
  StyledPrimarySubmitButton,
} from '../components';

const SuccessMessage = styled.p`
  margin-top: 0;
`;

export const ChangePasswordForm = React.memo(
  ({ onSubmit, errorMessage, success, email, onNavToLogin, onNavToResetPassword }) => {

    const renderForm = ({ setFieldValue }) => (
      <FormGrid columns={1}>
        <h3>Reset Password</h3>
        <div>Please enter the reset code you have received in your email</div>
        <div>{errorMessage}</div>
        <Field name="token" type="text" label="Reset Code" required component={TextField} />
        <Field
          name="newPassword"
          type="password"
          label="Enter a new password"
          required
          component={TextField}
        />
        <StyledPrimarySubmitButton type="submit">Change Password</StyledPrimarySubmitButton>
        <Button onClick={onNavToResetPassword} color="default" variant="text">
          Back
        </Button>
      </FormGrid>
    );

    if (success) {
      return (
        <FormGrid columns={1}>
          <h3>Reset Password</h3>
          <SuccessMessage>Your password has been updated</SuccessMessage>
          <Button fullWidth variant="contained" color="primary" onClick={onNavToLogin}>
            Login
          </Button>
        </FormGrid>
      );
    }

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        initialValues={{
          email,
        }}
        validationSchema={yup.object().shape({
          token: yup.string().required(),
          newPassword: yup
            .string()
            .min(5, 'Must be at least 5 characters')
            .required(),
        })}
      />
    );
  },
);
