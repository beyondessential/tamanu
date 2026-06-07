import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode';
import { startRegistration } from '@simplewebauthn/browser';
import * as yup from 'yup';

import { Typography } from '@material-ui/core';
import { BodyText, Field } from '../components';
import {
  Form,
  FormGrid,
  FormSubmitButton,
  OutlinedButton,
  TextButton,
  TextField,
} from '@tamanu/ui-components';
import { Colors } from '../constants/styles';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useTranslation } from '../contexts/Translation';
import { LoginAlert } from './LoginForm';
import { useApi } from '../api';
import { webauthnErrorMessage } from '../utils/webauthn';

const Heading = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 38px;
  line-height: 32px;
`;

const Subtext = styled(BodyText)`
  color: ${Colors.midText};
  padding-top: 10px;
`;

const PrimaryButton = styled(FormSubmitButton)`
  font-size: 14px;
  line-height: 18px;
  padding: 14px 0;
  margin-top: 15px;
`;

const Qr = styled.img`
  display: block;
  width: 180px;
  height: 180px;
  margin: 10px auto;
`;

const ManualKey = styled.code`
  display: block;
  text-align: center;
  word-break: break-all;
  font-size: 12px;
  color: ${Colors.midText};
  margin-bottom: 10px;
`;

/**
 * Redeeming an admin-issued MFA enrolment invite, from the login screen: the
 * user enters the invite token plus their email and password (the token alone
 * is never enough), gets a short-lived enrol session from central, and sets
 * up a passkey or authenticator app with it. Works on facility frontends too
 * — the facility forwards every step to central.
 */
export const MfaInviteForm = ({ onNavToLogin, initialEmail }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();

  // redeem -> enrol -> done
  const [step, setStep] = useState('redeem');
  const [enrolToken, setEnrolToken] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [totpEnrol, setTotpEnrol] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!totpEnrol) return;
    QRCode.toDataURL(totpEnrol)
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [totpEnrol]);

  const redeem = async ({ email, password, token }, { setSubmitting }) => {
    setError(null);
    try {
      const response = await api.post('mfa/enrolInvite/redeem', { email, password, token });
      setEnrolToken(response.token);
      setStep('enrol');
    } catch (e) {
      setError(
        getTranslation(
          'mfa.invite.redeemError',
          'Could not redeem the invite. Check the token, email, and password — the invite may have expired or already been used.',
        ),
      );
      setSubmitting(false);
    }
  };

  const enrolPasskey = async () => {
    setError(null);
    setBusy(true);
    try {
      const optionsJSON = await api.post('mfa/enrolInvite/webauthn/register-begin', {
        enrolToken,
      });
      const registrationResponse = await startRegistration({ optionsJSON });
      await api.post('mfa/enrolInvite/webauthn/register-finish', {
        enrolToken,
        registrationResponse,
      });
      setStep('done');
    } catch (e) {
      setError(webauthnErrorMessage(e, getTranslation));
    } finally {
      setBusy(false);
    }
  };

  const beginTotpEnrol = async () => {
    setError(null);
    try {
      const { otpauthUrl } = await api.post('mfa/enrolInvite/totp/enrol', { enrolToken });
      setTotpEnrol(otpauthUrl);
    } catch (e) {
      setError(getTranslation('mfa.totp.enrolError', 'Could not start authenticator setup.'));
    }
  };

  const confirmTotp = async ({ code }, { setSubmitting }) => {
    setError(null);
    try {
      await api.post('mfa/enrolInvite/totp/confirm', { enrolToken, code });
      setStep('done');
    } catch (e) {
      setError(getTranslation('mfa.totp.codeError', 'Incorrect code. Please try again.'));
      setSubmitting(false);
    }
  };

  // the manual fallback for QR: the base32 secret from the otpauth URI
  const manualKey = totpEnrol
    ? new URLSearchParams(totpEnrol.split('?')[1] ?? '').get('secret')
    : null;

  return (
    <FormGrid columns={1} data-testid="mfa-invite-form">
      <div>
        <Heading>
          <TranslatedText stringId="mfa.invite.heading" fallback="MFA enrolment invite" />
        </Heading>
        <Subtext>
          {step === 'redeem' && (
            <TranslatedText
              stringId="mfa.invite.subtitle"
              fallback="Enter the invite token you were given, along with your email and password."
            />
          )}
          {step === 'enrol' && (
            <TranslatedText
              stringId="mfa.invite.enrolSubtitle"
              fallback="Invite accepted. Now set up your authentication method."
            />
          )}
          {step === 'done' && (
            <TranslatedText
              stringId="mfa.invite.doneSubtitle"
              fallback="All set up. You can now log in."
            />
          )}
        </Subtext>
        {!!error && <LoginAlert>{error}</LoginAlert>}
      </div>

      {step === 'redeem' && (
        <Form
          onSubmit={redeem}
          initialValues={{ email: initialEmail ?? '' }}
          validationSchema={yup.object({
            email: yup.string().email().required(),
            password: yup.string().required(),
            token: yup.string().required(),
          })}
          render={() => (
            <FormGrid columns={1}>
              <Field
                name="email"
                type="email"
                label={<TranslatedText stringId="login.email.label" fallback="Email" />}
                component={TextField}
                required
                data-testid="mfa-invite-email"
              />
              <Field
                name="password"
                type="password"
                label={<TranslatedText stringId="login.password.label" fallback="Password" />}
                component={TextField}
                autoComplete="current-password"
                required
                data-testid="mfa-invite-password"
              />
              <Field
                name="token"
                label={
                  <TranslatedText stringId="mfa.invite.token.label" fallback="Invite token" />
                }
                component={TextField}
                required
                data-testid="mfa-invite-token"
              />
              <PrimaryButton type="submit" data-testid="mfa-invite-redeem">
                <TranslatedText stringId="general.action.continue" fallback="Continue" />
              </PrimaryButton>
            </FormGrid>
          )}
        />
      )}

      {step === 'enrol' && (
        <>
          <OutlinedButton
            onClick={enrolPasskey}
            disabled={busy}
            data-testid="mfa-invite-passkey"
          >
            <TranslatedText stringId="mfa.enrol.passkey" fallback="Set up a passkey" />
          </OutlinedButton>

          {!totpEnrol && (
            <TextButton onClick={beginTotpEnrol} data-testid="mfa-invite-use-totp">
              <TranslatedText
                stringId="mfa.useAuthenticatorApp"
                fallback="Use an authenticator app instead"
              />
            </TextButton>
          )}

          {totpEnrol && (
            <>
              <BodyText>
                <TranslatedText
                  stringId="mfa.totp.enrolInstructions"
                  fallback="Scan this QR code with your authenticator app, then enter the 6-digit code."
                />
              </BodyText>
              {qrDataUrl && <Qr src={qrDataUrl} alt="" data-testid="mfa-invite-totp-qr" />}
              {manualKey && <ManualKey data-testid="mfa-invite-manual-key">{manualKey}</ManualKey>}
              <Form
                onSubmit={confirmTotp}
                validationSchema={yup.object({ code: yup.string().required() })}
                render={() => (
                  <FormGrid columns={1}>
                    <Field
                      name="code"
                      label={
                        <TranslatedText
                          stringId="mfa.totp.code.label"
                          fallback="Authenticator code"
                        />
                      }
                      component={TextField}
                      placeholder={getTranslation('mfa.totp.code.placeholder', '123456')}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      data-testid="mfa-invite-totp-code"
                    />
                    <PrimaryButton type="submit" data-testid="mfa-invite-totp-submit">
                      <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                    </PrimaryButton>
                  </FormGrid>
                )}
              />
            </>
          )}
        </>
      )}

      {step === 'done' && (
        <PrimaryButton onClick={onNavToLogin} data-testid="mfa-invite-done">
          <TranslatedText stringId="mfa.invite.backToLogin" fallback="Continue to log in" />
        </PrimaryButton>
      )}

      {step !== 'done' && (
        <TextButton onClick={onNavToLogin} data-testid="mfa-invite-cancel">
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </TextButton>
      )}
    </FormGrid>
  );
};
