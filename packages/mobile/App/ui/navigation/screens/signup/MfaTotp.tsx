import React, { FunctionComponent, ReactElement, useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, StatusBar } from 'react-native';

import {
  FullView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { Routes } from '/helpers/routes';
import { readConfig } from '~/services/config';
import { useAuth } from '~/ui/contexts/AuthContext';
import { Button } from '/components/Button';
import { TextField } from '/components/TextField/TextField';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { ERROR_TYPE } from '@tamanu/errors';

/**
 * Second-factor step for a paused sign-in. Mobile completes MFA with an
 * authenticator app (TOTP) only — native passkeys are a separate effort.
 *
 * For a challenge the user just enters a code. For forced enrolment the seed
 * is set up first: the authenticator app usually lives on this same phone, so
 * rather than a QR (which can't be scanned from the device displaying it) we
 * open the otpauth:// URI directly — authenticator apps register that scheme —
 * with the secret shown for manual entry as a fallback.
 */
export const MfaTotp: FunctionComponent<any> = ({ navigation }): ReactElement => {
  const auth = useAuth();
  const { mfaPending, beginMfaSignInStep, completeMfaSignIn, cancelMfaSignIn } = auth;

  const isEnrol = mfaPending?.kind === 'enrol';
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<'enrolFailed' | 'badCode' | 'expired' | 'openFailed' | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEnrol) return;
    beginMfaSignInStep('totp/enrol')
      .then(({ otpauthUrl: url }) => setOtpauthUrl(url))
      .catch(() => setError('enrolFailed'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnrol]);

  // hermes' URL has no searchParams; the secret is base32 so a regex is safe
  const secret = otpauthUrl ? (otpauthUrl.match(/[?&]secret=([A-Z2-7]+)/i)?.[1] ?? null) : null;

  const onOpenAuthenticator = useCallback(() => {
    // the URL comes from the server: never hand a non-otpauth scheme to the
    // OS, and tell the user when nothing could open it (the manual key below
    // is the fallback)
    if (!otpauthUrl?.startsWith('otpauth://')) {
      setError('openFailed');
      return;
    }
    Linking.openURL(otpauthUrl).catch(() => setError('openFailed'));
  }, [otpauthUrl]);

  const navigateOnSuccess = useCallback(async () => {
    const facilityId = await readConfig('facilityId', '');
    if (!facilityId) {
      navigation.navigate(Routes.SignUpStack.SelectFacility);
    } else if (auth.checkFirstSession()) {
      navigation.navigate(Routes.HomeStack.Index);
    } else {
      navigation.navigate(Routes.HomeStack.Index, {
        screen: Routes.HomeStack.HomeTabs.Index,
      });
    }
  }, [navigation, auth]);

  const onSubmit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await completeMfaSignIn(isEnrol ? 'totp/confirm' : 'totp', { code });
      await navigateOnSuccess();
    } catch (err) {
      // a wrong code is retryable; anything else (typically the short-lived
      // pending pass expiring while the user was off in their authenticator
      // app) means this attempt is over and they must log in again
      setError(err?.type === ERROR_TYPE.AUTH_CREDENTIAL_INVALID ? 'badCode' : 'expired');
    } finally {
      setBusy(false);
    }
  }, [completeMfaSignIn, isEnrol, code, navigateOnSuccess]);

  const onCancel = useCallback(() => {
    cancelMfaSignIn();
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, [cancelMfaSignIn, navigation]);

  // e.g. after process death there is nothing to complete; go back to sign in
  useEffect(() => {
    if (!mfaPending) navigation.navigate(Routes.SignUpStack.SignIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mfaPending]);

  if (!mfaPending) return null;

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <StatusBar barStyle="light-content" />
      <StyledSafeAreaView>
        <KeyboardAvoidingView behavior="padding">
          <StyledView
            marginTop={screenPercentageToDP(8, Orientation.Height)}
            marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
            marginRight={screenPercentageToDP(2.43, Orientation.Width)}
          >
            <StyledText fontSize={30} fontWeight="bold" marginBottom={5} color={theme.colors.WHITE}>
              {isEnrol ? (
                <TranslatedText
                  stringId="mfa.enrol.heading"
                  fallback="Set up multi-factor authentication"
                />
              ) : (
                <TranslatedText stringId="mfa.challenge.heading" fallback="Multi-factor authentication" />
              )}
            </StyledText>
            <StyledText fontSize={14} color={theme.colors.WHITE} marginBottom={15}>
              {isEnrol ? (
                <TranslatedText
                  stringId="mfa.totp.enrolInstructions.mobile"
                  fallback="Add your account to an authenticator app, then enter the 6-digit code."
                />
              ) : (
                <TranslatedText
                  stringId="mfa.totp.challengeInstructions"
                  fallback="Enter the 6-digit code from your authenticator app."
                />
              )}
            </StyledText>

            {isEnrol && (
              <StyledView marginBottom={15}>
                <Button
                  onPress={onOpenAuthenticator}
                  disabled={!otpauthUrl}
                  buttonText={
                    <TranslatedText
                      stringId="mfa.totp.openAuthenticator"
                      fallback="Open in authenticator app"
                    />
                  }
                />
                {secret && (
                  <StyledText
                    fontSize={12}
                    color={theme.colors.WHITE}
                    marginTop={10}
                    textAlign="center"
                  >
                    <TranslatedText
                      stringId="mfa.totp.manualKey"
                      fallback="Or enter this key manually:"
                    />
                    {'\n'}
                    {secret}
                  </StyledText>
                )}
              </StyledView>
            )}

            <TextField
              label={<TranslatedText stringId="mfa.totp.code.label" fallback="Authenticator code" />}
              value={code}
              onChange={setCode}
              keyboardType="numeric"
            />
            {error && (
              <StyledText color={theme.colors.ALERT} fontSize={12} marginTop={5}>
                {error === 'enrolFailed' && (
                  <TranslatedText
                    stringId="mfa.totp.enrolError"
                    fallback="Could not start authenticator setup."
                  />
                )}
                {error === 'badCode' && (
                  <TranslatedText
                    stringId="mfa.totp.codeError"
                    fallback="Incorrect code. Please try again."
                  />
                )}
                {error === 'expired' && (
                  <TranslatedText
                    stringId="mfa.totp.expiredError"
                    fallback="This sign-in attempt has expired. Please cancel and log in again."
                  />
                )}
                {error === 'openFailed' && (
                  <TranslatedText
                    stringId="mfa.totp.openError"
                    fallback="Could not open an authenticator app. Enter the key below manually instead."
                  />
                )}
              </StyledText>
            )}
            <StyledView marginTop={15}>
              <Button
                onPress={onSubmit}
                disabled={busy || !code}
                buttonText={
                  <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                }
              />
            </StyledView>
            <StyledTouchableOpacity onPress={onCancel}>
              <StyledText
                width="100%"
                textAlign="center"
                marginTop={20}
                fontSize={12}
                color={theme.colors.WHITE}
              >
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
