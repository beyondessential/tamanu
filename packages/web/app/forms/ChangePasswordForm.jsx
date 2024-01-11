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
} from '../components';
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

const REQUIRED_VALIDATION_MESSAGE = '*Required';

const ChangePasswordFormComponent = ({
  onRestartFlow,
  errorMessage,
  onNavToLogin,
  onNavToResetPassword,
  setFieldError,
  errors,
}) => {
  return (
    <FormGrid columns={1}>
      <div>
        <FormHeading>Reset password</FormHeading>
        <FormSubtext>
          An email has been sent to the specified email address if it is registered with Tamanu.
          Please follow the instructions outlined in the email.
        </FormSubtext>
        {!!errorMessage && <FormSubtext>{errorMessage}</FormSubtext>}
      </div>
      <FieldContainer>
        <Field
          name="token"
          type="text"
          label="Reset code"
          required
          component={TextField}
          placeholder="Reset code"
          onChange={() => {
            if (errors.token === REQUIRED_VALIDATION_MESSAGE) {
              setFieldError('token', '');
            }
          }}
        />
        <HorizontalDivider />
        <Field
          name="newPassword"
          type="password"
          label="New password"
          required
          component={TextField}
          placeholder="New password"
          onChange={() => {
            if (errors.newPassword === REQUIRED_VALIDATION_MESSAGE) {
              setFieldError('newPassword', '');
            }
          }}
        />
        <Field
          name="confirmNewPassword"
          type="password"
          label="Confirm new password"
          required
          component={TextField}
          placeholder="Confirm new password"
          onChange={() => {
            if (errors.confirmNewPassword === REQUIRED_VALIDATION_MESSAGE) {
              setFieldError('confirmNewPassword', '');
            }
          }}
        />
      </FieldContainer>
      <ActionButtonContainer>
        <ChangePasswordButton type="submit">Reset password</ChangePasswordButton>
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
};

export const ChangePasswordForm = React.memo(
  ({
    onSubmit,
    onRestartFlow,
    errorMessage,
    success,
    email,
    onNavToLogin,
    onNavToResetPassword,
    onValidateResetCode,
  }) => {
    const renderForm = ({ setFieldError, errors }) => (
      <ChangePasswordFormComponent
        onRestartFlow={onRestartFlow}
        errorMessage={errorMessage}
        email={email}
        onNavToLogin={onNavToLogin}
        onNavToResetPassword={onNavToResetPassword}
        onValidateResetCode={onValidateResetCode}
        setFieldError={setFieldError}
        errors={errors}
      />
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
          token: yup
            .string()
            .required(REQUIRED_VALIDATION_MESSAGE)
            .test('checkValidToken', 'Code incorrect', async (value, context) => {
              if (value) {
                try {
                  await onValidateResetCode({
                    email: context.parent.email,
                    token: value,
                  });
                  return true;
                } catch (e) {
                  return false;
                }
              } else {
                return false;
              }
            }),
          newPassword: yup
            .string()
            .min(5, 'Must be at least 5 characters')
            .oneOf([yup.ref('confirmNewPassword'), null], `Passwords don't match`)
            .required(REQUIRED_VALIDATION_MESSAGE),
          confirmNewPassword: yup
            .string()
            .min(5, 'Must be at least 5 characters')
            .oneOf([yup.ref('newPassword'), null], `Passwords don't match`)
            .required(REQUIRED_VALIDATION_MESSAGE),
        })}
        suppressErrorDialog
      />
    );
  },
);
