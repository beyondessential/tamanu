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
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';

const FormTitleSection = styled.div`
  margin-bottom: 10px;
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
  margin-bottom: 10px;
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
  const { getTranslation } = useTranslation();

  return (
    <FormGrid columns={1}>
      <FormTitleSection>
        <FormHeading>
          <TranslatedText stringId="resetPassword.heading" fallback="Reset password" />
        </FormHeading>
        <FormSubtext>
          <TranslatedText
            stringId="resetPassword.message"
            fallback="An email has been sent to the specified email address if it is registered with.
          Please follow the instructions outlined in the email."
          />
        </FormSubtext>
        {!!errorMessage && <FormSubtext>{errorMessage}</FormSubtext>}
      </FormTitleSection>
      <FieldContainer>
        <Field
          name="token"
          type="text"
          label={<TranslatedText stringId="resetPassword.resetCode.label" fallback="Reset code" />}
          required
          component={TextField}
          placeholder={getTranslation('resetPassword.resetCode.placeholder', 'Enter reset code')}
          onChange={() => {
            if (errors.token === REQUIRED_VALIDATION_MESSAGE) {
              setFieldError('token', '');
            }
          }}
          autoComplete="off"
        />
        <HorizontalDivider />
        <Field
          name="newPassword"
          type="password"
          label={
            <TranslatedText stringId="resetPassword.newPassword.label" fallback="New password" />
          }
          required
          component={TextField}
          placeholder={getTranslation('resetPassword.newPassword.placeholder', 'New password')}
          onChange={() => {
            if (errors.newPassword === REQUIRED_VALIDATION_MESSAGE) {
              setFieldError('newPassword', '');
            }
          }}
          autoComplete="new-password"
        />
        <Field
          name="confirmNewPassword"
          type="password"
          label={
            <TranslatedText
              stringId="resetPassword.confirmNewPassword.label"
              fallback="Confirm new password"
            />
          }
          required
          component={TextField}
          placeholder={getTranslation(
            'resetPassword.confirmNewPassword.placeholder',
            'Confirm new password',
          )}
          onChange={() => {
            if (errors.confirmNewPassword === REQUIRED_VALIDATION_MESSAGE) {
              setFieldError('confirmNewPassword', '');
            }
          }}
        />
      </FieldContainer>
      <ActionButtonContainer>
        <ChangePasswordButton type="submit">
          <TranslatedText stringId="resetPassword.resetPassword.label" fallback="Reset password" />
        </ChangePasswordButton>
        <BackToLoginButton onClick={onNavToLogin} variant="outlined">
          <TranslatedText stringId="resetPassword.backToLogin.label" fallback="Back to login" />
        </BackToLoginButton>
      </ActionButtonContainer>
      <ResendCodeButton
        onClick={() => {
          onRestartFlow();
          onNavToResetPassword();
        }}
      >
        <TranslatedText
          stringId="resetPassword.resendResetCode.label"
          fallback="Resend reset code"
        />
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
    const { getTranslation } = useTranslation();
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
            <FormHeading>
              <TranslatedText
                stringId="resetPassword.success.heading"
                fallback="Password successfully reset"
              />
            </FormHeading>
            <SuccessSubtext>
              <TranslatedText
                stringId="resetPassword.success.subHeading"
                fallback="Your password has been successfully reset"
              />
            </SuccessSubtext>
          </div>
          <BackToLoginButton fullWidth variant="contained" color="primary" onClick={onNavToLogin}>
            <TranslatedText stringId="resetPassword.backToLogin.label" fallback="Back to login" />
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
            .test(
              'checkValidToken',
              getTranslation('validation.rule.checkValidToken', 'Code incorrect'),
              async (value, context) => {
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
              },
            ),
          newPassword: yup
            .string()
            .min(
              5,
              getTranslation('validation.rule.min5Characters', 'Must be at least 5 characters'),
            )
            .oneOf(
              [yup.ref('confirmNewPassword'), null],
              getTranslation('validation.rule.passwordMatch', `Passwords don't match`),
            )
            .required(REQUIRED_VALIDATION_MESSAGE),
          confirmNewPassword: yup
            .string()
            .min(
              5,
              getTranslation('validation.rule.min5Characters', 'Must be at least 5 characters'),
            )
            .oneOf(
              [yup.ref('newPassword'), null],
              getTranslation('validation.rule.passwordMatch', `Passwords don't match`),
            )
            .required(REQUIRED_VALIDATION_MESSAGE),
        })}
        suppressErrorDialog
      />
    );
  },
);
