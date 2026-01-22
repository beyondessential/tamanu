import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import {
  FormGrid,
  TextField,
  Form,
  FormSubmitButton,
  Button,
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { BodyText, Field } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { LoginAlert } from './LoginForm';

const ResetPasswordButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 14px 0;
  margin-top: 31px;
`;

const BackToLoginButton = styled(Button)`
  padding: 14px 0;
  margin-top: 4px;
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

const ResetPasswordFormComponent = ({ errorMessage, onNavToLogin }) => {
  const { getTranslation } = useTranslation();

  return (
    <FormGrid columns={1} data-testid="formgrid-ls0i">
      <div>
        <FormHeading data-testid="formheading-2yvj">
          <TranslatedText
            stringId="forgotPassword.heading"
            fallback="Forgot password"
            data-testid="translatedtext-hq8e"
          />
        </FormHeading>
        <FormSubtext data-testid="formsubtext-51jy">
          <TranslatedText
            stringId="forgotPassword.message"
            fallback="Enter your email address below and we will send you a reset code."
            data-testid="translatedtext-6vjp"
          />
        </FormSubtext>
        {!!errorMessage && <LoginAlert data-testid="formsubtext-bvu8">{errorMessage}</LoginAlert>}
      </div>
      <Field
        autoComplete="email"
        name="email"
        type="email"
        label={
          <TranslatedText
            stringId="forgotPassword.email.label"
            fallback="Email"
            data-testid="translatedtext-84fk"
          />
        }
        required
        component={TextField}
        placeholder={getTranslation('forgotPassword.email.placeholder', 'Enter your email address')}
        data-testid="field-b7t4"
      />
      <ResetPasswordButton
        text={
          <TranslatedText
            stringId="forgotPassword.sendResetCode.label"
            fallback="Send reset code"
            data-testid="translatedtext-q06s"
          />
        }
        data-testid="resetpasswordbutton-up5b"
      />
      <BackToLoginButton
        onClick={onNavToLogin}
        variant="outlined"
        data-testid="backtologinbutton-ml8w"
      >
        <TranslatedText
          stringId="forgotPassword.backToLogin.label"
          fallback="Back to login"
          data-testid="translatedtext-gn56"
        />
      </BackToLoginButton>
    </FormGrid>
  );
};

export const ResetPasswordForm = React.memo(
  ({ onSubmit, errorMessage, success, initialEmail, onNavToChangePassword, onNavToLogin }) => {
    const { getTranslation } = useTranslation();
    const renderForm = ({ setFieldError }) => (
      <ResetPasswordFormComponent
        errorMessage={errorMessage}
        onNavToLogin={onNavToLogin}
        setFieldError={setFieldError}
        data-testid="resetpasswordformcomponent-83un"
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
          email: initialEmail || '',
        }}
        validationSchema={yup.object().shape({
          email: yup
            .string()
            .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address'))
            .required(getTranslation('validation.required.inline', '*Required')),
        })}
        showInlineErrorsOnly
        data-testid="form-j4cb"
      />
    );
  },
);
