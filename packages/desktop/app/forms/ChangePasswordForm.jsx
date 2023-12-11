import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { FormGrid } from '../components/FormGrid';
import {
  Button,
  Field,
  Form,
  TextField,
  StyledPrimarySubmitButton,
  BodyText,
  FormSubmitButton,
} from '../components';
import { Colors } from '../constants';

const SuccessMessage = styled.p`
  margin-top: 0;
`;

const FormHeading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
`;

const FormSubtext = styled(BodyText)`
  color: ${Colors.midText};
  padding-top: 10px;
`;

const ChangePasswordButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 13px 0;
  margin-top: 15px;
`;

const StyledField = styled(Field)`
  .label-field {
    padding-top: 10px;
`;

const BackToLoginButton = styled(Button)`
  padding: 13px 0;
  margin-top: 5px;
`;

export const ChangePasswordForm = React.memo(
  ({ onSubmit, errorMessage, success, email, onNavToLogin, onNavToResetPassword }) => {
    const renderForm = ({ setFieldValue }) => (
      <FormGrid columns={1}>
        <div>
          <FormHeading>Reset password</FormHeading>
          <FormSubtext>Please enter the reset code you have received in your email</FormSubtext>
          <FormSubtext>{errorMessage}</FormSubtext>
        </div>
        <StyledField
          name="token"
          type="text"
          label="Reset Code"
          required
          component={TextField}
          placeholder="Reset code"
        />
        <StyledField
          name="newPassword"
          type="password"
          label="Enter a new password"
          required
          component={TextField}
          placeholder="New password"
        />
        <ChangePasswordButton type="submit">Change Password</ChangePasswordButton>
        <BackToLoginButton onClick={onNavToResetPassword} variant="outlined">
          Back to login
        </BackToLoginButton>
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
