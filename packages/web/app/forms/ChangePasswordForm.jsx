import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { FormGrid } from '../components/FormGrid';
import { BodyText, Button, Field, Form, FormSubmitButton, TextField } from '../components';
import { Colors } from '../constants';
import ApprovedIcon from '../assets/images/approved_circle.svg';

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
  padding: 14px 0;
  margin: 13px 0;
`;

const BackToLoginButton = styled(Button)`
  padding: 14px 0;
  margin-top: 5px;
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const ActionButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const SuccessSubtext = styled(FormSubtext)`
  margin: 10px 0 30px 0;
`;

export const ChangePasswordForm = React.memo(
  ({ onSubmit, errorMessage, success, email, onNavToLogin, onNavToResetPassword }) => {
    const renderForm = ({ setFieldValue }) => (
      <FormGrid columns={1}>
        <div>
          <FormHeading>Reset password</FormHeading>
          <FormSubtext>Please enter the reset code you have received in your email</FormSubtext>
          {!!errorMessage && <FormSubtext>{errorMessage}</FormSubtext>}
        </div>
        <FieldContainer>
          <Field
            name="token"
            type="text"
            label="Reset Code"
            required
            component={TextField}
            placeholder="Reset code"
          />
          <Field
            name="newPassword"
            type="password"
            label="Enter a new password"
            required
            component={TextField}
            placeholder="New password"
          />
        </FieldContainer>
        <ActionButtonContainer>
          <ChangePasswordButton type="submit">Change Password</ChangePasswordButton>
          <BackToLoginButton onClick={onNavToLogin} variant="outlined">
            Back to login
          </BackToLoginButton>
        </ActionButtonContainer>
      </FormGrid>
    );

    if (success) {
      return (
        <FormGrid columns={1}>
          <IconContainer>
            <img src={ApprovedIcon} alt="Circle check" />
          </IconContainer>
          <div>
            <FormHeading>Password successfully reset</FormHeading>
            <SuccessSubtext>Your password has been successfully reset.</SuccessSubtext>
          </div>
          <BackToLoginButton fullWidth variant="contained" color="primary" onClick={onNavToLogin}>
            Back to login
          </BackToLoginButton>
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
