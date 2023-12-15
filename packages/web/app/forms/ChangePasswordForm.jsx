import React from 'react';
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
  StyledPrimarySubmitButton,
} from '../components';
import { Colors } from '../constants';
import ApprovedIcon from '../assets/images/approved.svg';

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
  gap: 25px;
`;

const SuccessSubtext = styled(FormSubtext)`
  margin: 10px 0 30px 0;
`;

const HorizontalDivider = styled.div`
  border-bottom: 1px solid #dedede;
`;

const ResendCodeButton = styled(TextButton)`
  font-size: 11px;
  color: black;
  font-weight: 400;

  :hover {
    color: ${Colors.primary};
    font-weight: 500;
    text-decoration: underline;
  }
`;

const StyledField = styled(Field)`
  .MuiFormHelperText-root {
    position: absolute;
    bottom: -20px;
  }
`;

export const ChangePasswordForm = React.memo(
  ({
    onSubmit,
    onRestartFlow,
    errorMessage,
    success,
    email,
    onNavToLogin,
    onNavToResetPassword,
  }) => {
    const renderForm = ({ setFieldValue }) => (
      <FormGrid columns={1}>
        <div>
          <FormHeading>Reset password</FormHeading>
          <FormSubtext>
            We have emailed you a reset code. Please enter the code and your new password below to
            reset your password.
          </FormSubtext>
          <ErrorText $isError={!!errorMessage}>{errorMessage}</ErrorText>
        </div>
        <FieldContainer>
          <StyledField
            name="token"
            type="text"
            label="Reset Code"
            required
            component={TextField}
            placeholder="Reset code"
          />
          <HorizontalDivider />
          <StyledField
            name="newPassword"
            type="password"
            label="New password"
            required
            component={TextField}
            placeholder="New password"
          />
          <StyledField
            name="confirmNewPassword"
            type="password"
            label="Confirm new password"
            required
            component={TextField}
            placeholder="Confirm new password"
          />
        </FieldContainer>
        <ActionButtonContainer>
          <ChangePasswordButton type="submit">Reset Password</ChangePasswordButton>
          <BackToLoginButton onClick={onNavToLogin} variant="outlined">
            Back to login
          </BackToLoginButton>
        </ActionButtonContainer>
        <ResendCodeButton
          onClick={() => {
            onRestartFlow();
            onNavToResetPassword();
          }}
        >
          Resend reset code
        </ResendCodeButton>
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
          token: yup.string().required('*Required'),
          newPassword: yup
            .string()
            .min(5, 'Must be at least 5 characters')
            .oneOf([yup.ref('confirmNewPassword'), null], `Passwords don't match`)
            .required('*Required'),
          confirmNewPassword: yup
            .string()
            .oneOf([yup.ref('newPassword'), null], `Passwords don't match`)
            .required('*Required'),
        })}
        showErrorDialog={false}
      />
    );
  },
);
