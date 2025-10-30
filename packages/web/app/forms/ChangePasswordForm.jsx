import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import {
  BodyText,
  Field,
} from '../components';
import {
  TextField,
  Form,
  Button,
  TextButton,
  FormSubmitButton,
  FormGrid,
  TranslatedText
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import ApprovedIcon from '../assets/images/approved_circle.svg';
import { useTranslation } from '../contexts/Translation';
import { isBcryptHash } from '@tamanu/utils/password';

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
    <FormGrid columns={1} data-testid="formgrid-md71">
      <FormTitleSection data-testid="formtitlesection-spnn">
        <FormHeading data-testid="formheading-8281">
          <TranslatedText
            stringId="resetPassword.heading"
            fallback="Reset password"
            data-testid="translatedtext-vjh4"
          />
        </FormHeading>
        <FormSubtext data-testid="formsubtext-k9rz">
          <TranslatedText
            stringId="resetPassword.message"
            fallback="An email has been sent to the specified email address if it is registered with.
          Please follow the instructions outlined in the email."
            data-testid="translatedtext-4xem"
          />
        </FormSubtext>
        {!!errorMessage && <FormSubtext data-testid="formsubtext-a66n">{errorMessage}</FormSubtext>}
      </FormTitleSection>
      <FieldContainer data-testid="fieldcontainer-t25u">
        <Field
          autoComplete="one-time-code"
          name="token"
          type="text"
          label={
            <TranslatedText
              stringId="resetPassword.resetCode.label"
              fallback="Reset code"
              data-testid="translatedtext-dvan"
            />
          }
          required
          component={TextField}
          placeholder={getTranslation('resetPassword.resetCode.placeholder', 'Enter reset code')}
          onChange={() => {
            if (errors.token === REQUIRED_VALIDATION_MESSAGE) {
              setFieldError('token', '');
            }
          }}
          data-testid="field-tzs8"
        />
        <HorizontalDivider data-testid="horizontaldivider-sov1" />
        <Field
          name="newPassword"
          type="password"
          label={
            <TranslatedText
              stringId="resetPassword.newPassword.label"
              fallback="New password"
              data-testid="translatedtext-wkys"
            />
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
          data-testid="field-wpnd"
        />
        <Field
          autoComplete="new-password"
          name="confirmNewPassword"
          type="password"
          label={
            <TranslatedText
              stringId="resetPassword.confirmNewPassword.label"
              fallback="Confirm new password"
              data-testid="translatedtext-aulk"
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
          data-testid="field-vb47"
        />
      </FieldContainer>
      <ActionButtonContainer data-testid="actionbuttoncontainer-jf25">
        <ChangePasswordButton type="submit" data-testid="changepasswordbutton-wc0g">
          <TranslatedText
            stringId="resetPassword.resetPassword.label"
            fallback="Reset password"
            data-testid="translatedtext-oklq"
          />
        </ChangePasswordButton>
        <BackToLoginButton
          onClick={onNavToLogin}
          variant="outlined"
          data-testid="backtologinbutton-ywhg"
        >
          <TranslatedText
            stringId="resetPassword.backToLogin.label"
            fallback="Back to login"
            data-testid="translatedtext-li1f"
          />
        </BackToLoginButton>
      </ActionButtonContainer>
      <ResendCodeButton
        onClick={() => {
          onRestartFlow();
          onNavToResetPassword();
        }}
        data-testid="resendcodebutton-bfz0"
      >
        <TranslatedText
          stringId="resetPassword.resendResetCode.label"
          fallback="Resend reset code"
          data-testid="translatedtext-qcpj"
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
        data-testid="changepasswordformcomponent-4brl"
      />
    );

    if (success) {
      return (
        <FormGrid columns={1} data-testid="formgrid-n9yn">
          <IconContainer data-testid="iconcontainer-cvn0">
            <img src={ApprovedIcon} alt="Circle check" />
          </IconContainer>
          <div>
            <FormHeading data-testid="formheading-ilti">
              <TranslatedText
                stringId="resetPassword.success.heading"
                fallback="Password successfully reset"
                data-testid="translatedtext-nsum"
              />
            </FormHeading>
            <SuccessSubtext data-testid="successsubtext-zfgd">
              <TranslatedText
                stringId="resetPassword.success.subHeading"
                fallback="Your password has been successfully reset"
                data-testid="translatedtext-89z8"
              />
            </SuccessSubtext>
          </div>
          <BackToLoginButton
            fullWidth
            variant="contained"
            color="primary"
            onClick={onNavToLogin}
            data-testid="backtologinbutton-6h27"
          >
            <TranslatedText
              stringId="resetPassword.backToLogin.label"
              fallback="Back to login"
              data-testid="translatedtext-t1cs"
            />
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
              getTranslation('validation.rule.passwordMatch', 'Passwords don’t match'),
            )
            .required(getTranslation('validation.required.inline', '*Required'))
            .test(
              'password-is-not-hashed',
              <TranslatedText
                stringId="validation.password.isHashed"
                fallback="Password must not be start with hashed (.e.g. $2a$1$, $2a$12$, $2b$1$, $2b$12$, $2y$1$, $2y$12$)"
              />,
              function(value) {
                return !isBcryptHash(value);
              },
            ),
          confirmNewPassword: yup
            .string()
            .min(
              5,
              getTranslation('validation.rule.min5Characters', 'Must be at least 5 characters'),
            )
            .oneOf(
              [yup.ref('newPassword'), null],
              getTranslation('validation.rule.passwordMatch', 'Passwords don’t match'),
            )
            .required(getTranslation('validation.required.inline', '*Required')),
        })}
        suppressErrorDialog
        data-testid="form-xain"
      />
    );
  },
);
