import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import QRCode from 'qrcode';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
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
import { cancelMfaLogin, completeMfaLogin, getMfaPending } from '../store';
import { useApi } from '../api';

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

const WEBAUTHN = 'webauthn';
const TOTP = 'totp';

// the user-facing failure for any WebAuthn ceremony cancellation/error; the
// browser's own errors aren't helpful or safe to surface verbatim
const webauthnError = getTranslation =>
  getTranslation('mfa.webauthn.error', 'Passkey could not be used. Please try again.');

export const MfaLoginForm = () => {
  const api = useApi();
  const dispatch = useDispatch();
  const { getTranslation } = useTranslation();
  const mfaPending = useSelector(getMfaPending);

  const isEnrol = mfaPending?.kind === 'enrol';
  const factors = mfaPending?.factors ?? [];
  const hasWebAuthn = factors.includes(WEBAUTHN);
  const hasTotp = factors.includes(TOTP);

  // show the secondary (TOTP) factor inline once chosen, or immediately when
  // it's the only option
  const [showTotp, setShowTotp] = useState(!hasWebAuthn && hasTotp);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // enrol-TOTP: the otpauth URI to confirm against, rendered as a QR
  const [totpEnrol, setTotpEnrol] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!totpEnrol) return;
    QRCode.toDataURL(totpEnrol).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [totpEnrol]);

  if (!mfaPending) return null;

  const runWebAuthn = async () => {
    setError(null);
    setBusy(true);
    try {
      if (isEnrol) {
        const optionsJSON = await api.beginMfaLogin('webauthn/register-begin', mfaPending.token);
        const registrationResponse = await startRegistration({ optionsJSON });
        await dispatch(completeMfaLogin('webauthn/register-finish', { registrationResponse }));
      } else {
        const optionsJSON = await api.beginMfaLogin('webauthn/assert-begin', mfaPending.token);
        const assertionResponse = await startAuthentication({ optionsJSON });
        await dispatch(completeMfaLogin('webauthn/assert-finish', { assertionResponse }));
      }
      // success dispatches LOGIN_SUCCESS and this form unmounts
    } catch (e) {
      // login boundary: keep the message generic, but leave a trace
      // eslint-disable-next-line no-console
      console.error('WebAuthn login ceremony failed', e);
      setError(webauthnError(getTranslation));
    } finally {
      setBusy(false);
    }
  };

  const beginTotpEnrol = async () => {
    setError(null);
    setShowTotp(true);
    try {
      const { otpauthUrl } = await api.beginMfaLogin('totp/enrol', mfaPending.token);
      setTotpEnrol(otpauthUrl);
    } catch (e) {
      setError(getTranslation('mfa.totp.enrolError', 'Could not start authenticator setup.'));
    }
  };

  const submitTotpCode = async ({ code }, { setSubmitting }) => {
    setError(null);
    try {
      const path = isEnrol ? 'totp/confirm' : 'totp';
      await dispatch(completeMfaLogin(path, { code }));
    } catch (e) {
      setError(getTranslation('mfa.totp.codeError', 'Incorrect code. Please try again.'));
      setSubmitting(false);
    }
  };

  const skip = async () => {
    setError(null);
    try {
      await dispatch(completeMfaLogin('skip'));
    } catch (e) {
      setError(getTranslation('mfa.skip.error', 'Could not skip. Please set up a method.'));
    }
  };

  const heading = isEnrol ? (
    <TranslatedText stringId="mfa.enrol.heading" fallback="Set up multi-factor authentication" />
  ) : (
    <TranslatedText stringId="mfa.challenge.heading" fallback="Multi-factor authentication" />
  );

  const subtext = isEnrol ? (
    <TranslatedText
      stringId="mfa.enrol.subtitle"
      fallback="Your account requires a second factor. Set one up to continue."
    />
  ) : (
    <TranslatedText
      stringId="mfa.challenge.subtitle"
      fallback="Confirm it's you to finish logging in."
    />
  );

  return (
    <FormGrid columns={1} data-testid="mfa-loginform">
      <div>
        <Heading>{heading}</Heading>
        <Subtext>{subtext}</Subtext>
        {!!error && <LoginAlert>{error}</LoginAlert>}
      </div>

      {hasWebAuthn && (
        <OutlinedButton onClick={runWebAuthn} disabled={busy} data-testid="mfa-passkey-button">
          {isEnrol ? (
            <TranslatedText stringId="mfa.enrol.passkey" fallback="Set up a passkey" />
          ) : (
            <TranslatedText stringId="mfa.challenge.passkey" fallback="Sign in with a passkey" />
          )}
        </OutlinedButton>
      )}

      {hasWebAuthn && hasTotp && !showTotp && (
        <TextButton onClick={isEnrol ? beginTotpEnrol : () => setShowTotp(true)} data-testid="mfa-use-totp">
          <TranslatedText
            stringId="mfa.useAuthenticatorApp"
            fallback="Use an authenticator app instead"
          />
        </TextButton>
      )}

      {hasTotp && showTotp && (
        <>
          {isEnrol && (
            <BodyText>
              <TranslatedText
                stringId="mfa.totp.enrolInstructions"
                fallback="Scan this QR code with your authenticator app, then enter the 6-digit code."
              />
              {qrDataUrl && <Qr src={qrDataUrl} alt="" data-testid="mfa-totp-qr" />}
            </BodyText>
          )}
          {(!isEnrol || totpEnrol) && (
            <Form
              onSubmit={submitTotpCode}
              validationSchema={yup.object({ code: yup.string().required() })}
              render={() => (
                <FormGrid columns={1}>
                  <Field
                    name="code"
                    label={
                      <TranslatedText stringId="mfa.totp.code.label" fallback="Authenticator code" />
                    }
                    component={TextField}
                    placeholder={getTranslation('mfa.totp.code.placeholder', '123456')}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    data-testid="mfa-totp-code"
                  />
                  <PrimaryButton type="submit" data-testid="mfa-totp-submit">
                    <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                  </PrimaryButton>
                </FormGrid>
              )}
            />
          )}
        </>
      )}

      {isEnrol && mfaPending.skippable && (
        <TextButton onClick={skip} data-testid="mfa-skip">
          <TranslatedText stringId="mfa.enrol.skip" fallback="Skip for now" />
        </TextButton>
      )}

      <TextButton onClick={() => dispatch(cancelMfaLogin())} data-testid="mfa-cancel">
        <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
      </TextButton>
    </FormGrid>
  );
};
