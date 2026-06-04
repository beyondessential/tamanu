import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { startAuthentication } from '@simplewebauthn/browser';
import * as yup from 'yup';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import {
  BodyText,
  CheckField,
  Field,
} from '../components';
import {
  TextField,
  Form,
  FormGrid,
  FormSubmitButton,
  OutlinedButton,
  TextButton,
} from '@tamanu/ui-components';
import { MFA_PASSWORDLESS } from '@tamanu/constants';
import { Colors } from '../constants/styles';
import { LanguageSelector } from '../components/LanguageSelector';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { useApi } from '../api';
import { passwordlessLogin } from '../store';

export const LoginAlert = styled(({ children, ...props }) => (
  <Alert severity="error" icon={false} data-testid="loginerror-ppw6" {...props}>
    {children}
  </Alert>
))`
  border: oklch(from currentColor calc(l * 1.9) calc(c * 2) h) solid 1px;
  border-radius: 0.5em;
  margin-top: 1em;
  white-space: pre-line;
`;

const LoginHeading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
`;

const LoginSubtext = styled(BodyText)`
  color: ${Colors.midText};
  padding-top: 10px;
`;

const PasskeyLoginButton = styled(OutlinedButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 12px 0;
`;

const LoginButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 14px 0;
  margin-top: 15px;
`;

const ForgotPasswordButton = styled(TextButton)`
  color: black;
  font-size: 11px;
  font-weight: 400;
  text-transform: none;

  :hover {
      color: ${Colors.primary};
    font-weight: 500;
    text-decoration: underline;
  }
`;

const RememberMeRow = styled.div`
  display: flex;
  align-items: center;
  justify-self: flex-end;
  justify-content: flex-end;
  font-size: 16px;
  padding-top: 5px;
`;

const StyledField = styled(Field)`
  .label-field {
    padding-top: 5px;
  }
`;

const StyledCheckboxField = styled(Field)`
  .MuiFormControlLabel-root {
    margin-right: 0;

    .MuiTypography-root {
      font-size: 11px;
      color: black;
      font-weight: 500;
    }

    .MuiButtonBase-root {
      padding: 0 5px;
    }
  }
`;

const LoginFormComponent = ({
  errorMessage,
  onNavToResetPassword,
  onNavToMfaInvite,
  setFieldError,
  rememberEmail,
}) => {
  const { getTranslation } = useTranslation();
  const api = useApi();
  const dispatch = useDispatch();
  const [passkeyError, setPasskeyError] = useState(null);

  // what the server is willing to offer pre-auth (off is server-enforced; this
  // only drives presentation)
  const { data: loginFeatures } = useQuery({
    queryKey: ['loginFeatures'],
    queryFn: () => api.get('public/loginFeatures'),
    staleTime: 60_000,
    retry: false,
  });
  const passwordlessMode = loginFeatures?.passwordless ?? MFA_PASSWORDLESS.OFF;

  const signInWithPasskey = useCallback(
    async ({ conditional = false } = {}) => {
      setPasskeyError(null);
      try {
        const optionsJSON = await api.beginPasswordlessLogin();
        const assertionResponse = await startAuthentication({
          optionsJSON,
          useBrowserAutofill: conditional,
        });
        await dispatch(passwordlessLogin(assertionResponse));
        // success unmounts this form
      } catch (e) {
        // a conditional (autofill) ceremony aborts routinely — never surface it
        if (!conditional) {
          setPasskeyError(
            getTranslation('mfa.webauthn.error', 'Passkey could not be used. Please try again.'),
          );
        }
      }
    },
    [api, dispatch, getTranslation],
  );

  useEffect(() => {
    // promoted: actively offer passkeys from the email field's autofill
    if (passwordlessMode === MFA_PASSWORDLESS.PROMOTED) {
      signInWithPasskey({ conditional: true });
    }
  }, [passwordlessMode, signInWithPasskey]);

  const removeValidation = () => {
    setFieldError('email', '');
    setFieldError('password', '');
  };

  return (
    <FormGrid columns={1} data-testid="formgrid-jpyq">
      <div>
        <LoginHeading data-testid="loginheading-uupy">
          {rememberEmail ? (
            <TranslatedText
              stringId="login.heading.welcomeBack"
              fallback="Welcome back"
              data-testid="translatedtext-8aef"
            />
          ) : (
            <TranslatedText
              stringId="login.heading.login"
              fallback="Log in"
              data-testid="translatedtext-zknz"
            />
          )}
        </LoginHeading>
        <LoginSubtext data-testid="loginsubtext-wf66">
          <TranslatedText
            stringId="login.subTitle"
            fallback="Enter your details below to log in"
            data-testid="translatedtext-hwc1"
          />
        </LoginSubtext>
        {!!errorMessage && <LoginAlert>{errorMessage}</LoginAlert>}
        {!!passkeyError && <LoginAlert data-testid="passkey-error">{passkeyError}</LoginAlert>}
      </div>
      <StyledField
        name="email"
        type="email"
        label={
          <TranslatedText
            stringId="login.email.label"
            fallback="Email"
            data-testid="translatedtext-ga68"
          />
        }
        required
        component={TextField}
        placeholder={getTranslation('login.email.placeholder', 'Enter your email address')}
        onChange={() => removeValidation()}
        autoComplete="username webauthn"
        enablePasting
        data-testid="styledfield-dwnl"
      />
      <div>
        <StyledField
          name="password"
          label={
            <TranslatedText
              stringId="login.password.label"
              fallback="Password"
              data-testid="translatedtext-7902"
            />
          }
          type="password"
          required
          component={TextField}
          placeholder={getTranslation('login.password.placeholder', 'Enter your password')}
          onChange={() => removeValidation()}
          autoComplete="off"
          data-testid="styledfield-a9k6"
        />
        <RememberMeRow data-testid="remembermerow-feiu">
          <StyledCheckboxField
            name="rememberMe"
            label={
              <TranslatedText
                stringId="login.rememberMe.label"
                fallback="Remember me"
                data-testid="translatedtext-vwl7"
              />
            }
            component={CheckField}
            data-testid="styledcheckboxfield-jnlv"
          />
        </RememberMeRow>
      </div>
      <LoginButton
        text={
          <TranslatedText
            stringId="login.login.label"
            fallback="Log in"
            data-testid="translatedtext-zt8g"
          />
        }
        data-testid="loginbutton-gx21"
      />
      {passwordlessMode !== MFA_PASSWORDLESS.OFF && (
        <PasskeyLoginButton
          onClick={() => signInWithPasskey()}
          data-testid="passwordless-login-button"
        >
          <TranslatedText stringId="login.passkey.label" fallback="Sign in with a passkey" />
        </PasskeyLoginButton>
      )}
      <LanguageSelector data-testid="languageselector-9z0j" />
      <ForgotPasswordButton
        onClick={onNavToResetPassword}
        color="default"
        variant="text"
        data-testid="forgotpasswordbutton-mbnb"
      >
        <TranslatedText
          stringId="login.forgotPassword.label"
          fallback="Forgot password?"
          data-testid="translatedtext-427q"
        />
      </ForgotPasswordButton>
      <ForgotPasswordButton
        onClick={onNavToMfaInvite}
        color="default"
        variant="text"
        data-testid="mfa-invite-link"
      >
        <TranslatedText
          stringId="login.mfaInvite.label"
          fallback="Have an MFA enrolment invite?"
        />
      </ForgotPasswordButton>
    </FormGrid>
  );
};

export const LoginForm = React.memo(
  ({ onSubmit, errorMessage, rememberEmail, onNavToResetPassword, onNavToMfaInvite }) => {
    const { getTranslation } = useTranslation();
    const [isAdvancedExpanded, setAdvancedExpanded] = useState(false);

    const onError = errors => {
      if (errors.host) {
        setAdvancedExpanded(true);
      }
    };

    const renderForm = ({ setFieldValue, setFieldError }) => (
      <LoginFormComponent
        errorMessage={errorMessage}
        isAdvancedExpanded={isAdvancedExpanded}
        setAdvancedExpanded={setAdvancedExpanded}
        setFieldValue={setFieldValue}
        onNavToResetPassword={onNavToResetPassword}
        onNavToMfaInvite={onNavToMfaInvite}
        setFieldError={setFieldError}
        rememberEmail={rememberEmail}
        data-testid="loginformcomponent-g9rh"
      />
    );

    return (
      <Form
        onSubmit={onSubmit}
        onError={onError}
        render={renderForm}
        initialValues={{
          email: rememberEmail,
          rememberMe: !!rememberEmail,
        }}
        validationSchema={yup.object().shape({
          email: yup
            .string()
            .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address'))
            .nullable()
            .required(),
          password: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="login.password.label"
                fallback="Password"
                data-testid="translatedtext-bmya"
              />,
            ),
        })}
        data-testid="form-n5by"
      />
    );
  },
);
