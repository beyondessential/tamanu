import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode';
import { startRegistration } from '@simplewebauthn/browser';
import * as yup from 'yup';

import {
  DateDisplay,
  Modal,
  Form,
  FormGrid,
  FormSubmitButton,
  OutlinedButton,
  TextField,
  TextInput,
  TranslatedText,
} from '@tamanu/ui-components';
import { BodyText } from './Typography';
import { Field } from './Field';
import { Colors } from '../constants';
import { useTranslation } from '../contexts/Translation';
import { useApi } from '../api';
import { ConfirmModal } from './ConfirmModal';
import { PasskeyCapabilities } from './PasskeyCapabilities';
import { webauthnErrorMessage } from '../utils/webauthn';

const Section = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid ${Colors.outline};
  &:last-child {
    border-bottom: none;
  }
`;

const SectionHeading = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${Colors.darkestText};
  margin-bottom: 8px;
`;

const FactorRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: ${Colors.darkText};
`;

const FactorMeta = styled.span`
  color: ${Colors.midText};
  font-size: 12px;
  margin-left: 8px;
`;

const PasskeyCapabilityLine = styled.div`
  margin-top: 4px;
`;

const RowActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;

// compact outlined buttons for the inline row actions, so they read as
// buttons and aren't bunched together
const RowButton = styled(OutlinedButton)`
  padding: 4px 14px;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
`;

const RenameInput = styled(TextInput)`
  flex: 1;
  margin-right: 8px;
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

const ErrorText = styled(BodyText)`
  color: ${Colors.alert};
`;

const PasswordlessWarning = styled.div`
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid ${Colors.alert};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AddPasskeyRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
`;

/**
 * Self-service security methods management. The methods response doubles as
 * the capability probe: totp.managedCentrally means this server can't run
 * authenticator-app enrolment (facility — it still knows the synced
 * confirmation state), and a 403 means MFA is disabled or the user may not
 * manage factors.
 */
export const MfaSettingsModal = ({ open, onClose }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();

  const [methods, setMethods] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // TOTP enrolment in progress: otpauth URI + its QR rendering
  const [totpEnrol, setTotpEnrol] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showRemoveTotp, setShowRemoveTotp] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  // credential id being renamed, and the in-progress value
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  // whether the server offers passwordless login (so a non-passwordless passkey
  // is worth warning about), and the just-enrolled credential to warn about
  const [passwordlessAvailable, setPasswordlessAvailable] = useState(false);
  const [retryTarget, setRetryTarget] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('mfa/methods');
      setMethods(data);
      setUnavailable(false);
      return data;
    } catch (e) {
      setMethods(null);
      setUnavailable(true);
      return null;
    }
  }, [api]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTotpEnrol(null);
    setRetryTarget(null);
    refresh();
    // the passwordless capability endpoint is public; absent (older server) ⇒
    // treat as unavailable, so we never warn about a feature that isn't there
    api
      .get('public/loginFeatures')
      .then(features => setPasswordlessAvailable(features?.passwordless && features.passwordless !== 'off'))
      .catch(() => setPasswordlessAvailable(false));
  }, [open, refresh, api]);

  useEffect(() => {
    if (!totpEnrol) return;
    QRCode.toDataURL(totpEnrol)
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [totpEnrol]);

  const addPasskey = async ({ forceResident = false } = {}) => {
    setError(null);
    setRetryTarget(null);
    setBusy(true);
    try {
      const optionsJSON = await api.post(
        'mfa/webauthn/register-begin',
        forceResident ? { requireResidentKey: true } : {},
      );
      const registrationResponse = await startRegistration({ optionsJSON });
      const created = await api.post('mfa/webauthn/register-finish', {
        registrationResponse,
        friendlyName: newPasskeyName.trim() || null,
      });
      setNewPasskeyName('');
      const data = await refresh();
      // in 'warn' mode, if this passkey can't do passwordless (and passwordless
      // is on offer), surface it and let the user retry forcing a resident key
      if (
        !forceResident &&
        created?.discoverable === false &&
        data?.residentKeyMode === 'warn' &&
        passwordlessAvailable
      ) {
        setRetryTarget(created.id);
      }
    } catch (e) {
      setError(webauthnErrorMessage(e, getTranslation));
    } finally {
      setBusy(false);
    }
  };

  // "try again for passwordless": drop the non-discoverable key and re-enrol
  // forcing a resident credential (the same authenticator is then free to
  // re-create it as discoverable)
  const retryPasswordless = async () => {
    const credentialId = retryTarget;
    setRetryTarget(null);
    try {
      await api.delete(`mfa/webauthn/${credentialId}`);
    } catch (e) {
      // if the cleanup fails, still attempt the forced enrolment
    }
    await addPasskey({ forceResident: true });
  };

  const startRename = credential => {
    setRenameId(credential.id);
    setRenameValue(credential.friendlyName ?? '');
  };

  const submitRename = async () => {
    setError(null);
    try {
      await api.patch(`mfa/webauthn/${renameId}`, { friendlyName: renameValue.trim() });
      setRenameId(null);
      await refresh();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Passkey rename failed', e);
      setError(
        e?.message ?? getTranslation('mfa.rename.error', 'Could not rename this passkey.'),
      );
    }
  };

  const beginTotpEnrol = async () => {
    setError(null);
    try {
      const { otpauthUrl } = await api.post('mfa/totp/enrol');
      setTotpEnrol(otpauthUrl);
    } catch (e) {
      setError(getTranslation('mfa.totp.enrolError', 'Could not start authenticator setup.'));
    }
  };

  const confirmTotp = async ({ code }, { setSubmitting }) => {
    setError(null);
    try {
      await api.post('mfa/totp/confirm', { code });
      setTotpEnrol(null);
      await refresh();
    } catch (e) {
      setError(getTranslation('mfa.totp.codeError', 'Incorrect code. Please try again.'));
      setSubmitting(false);
    }
  };

  const removePasskey = async () => {
    setError(null);
    try {
      await api.delete(`mfa/webauthn/${removeTarget.id}`);
      setRemoveTarget(null);
      await refresh();
    } catch (e) {
      setRemoveTarget(null);
      setError(getTranslation('mfa.remove.error', 'Could not remove this method.'));
    }
  };

  const removeTotp = async () => {
    setError(null);
    setShowRemoveTotp(false);
    try {
      await api.delete('mfa/totp');
      await refresh();
    } catch (e) {
      setError(getTranslation('mfa.remove.error', 'Could not remove this method.'));
    }
  };

  // the manual fallback for QR: the base32 secret from the otpauth URI
  const manualKey = totpEnrol ? new URLSearchParams(totpEnrol.split('?')[1] ?? '').get('secret') : null;

  return (
    <Modal
      title={
        <TranslatedText stringId="mfa.settings.title" fallback="Multi-factor authentication" />
      }
      open={open}
      onClose={onClose}
      data-testid="mfa-settings-modal"
    >
      {!!error && <ErrorText data-testid="mfa-settings-error">{error}</ErrorText>}

      {retryTarget && (
        <PasswordlessWarning data-testid="mfa-passwordless-warning">
          <BodyText>
            <TranslatedText
              stringId="mfa.settings.notPasswordlessCapable"
              fallback="This passkey was saved, but your device didn't make it usable for passwordless sign-in. You can try again on a device that supports it, or keep it as a second factor."
            />
          </BodyText>
          <RowActions>
            <RowButton onClick={retryPasswordless} disabled={busy} data-testid="mfa-passwordless-retry">
              <TranslatedText
                stringId="mfa.settings.retryPasswordless"
                fallback="Try again for passwordless"
              />
            </RowButton>
            <RowButton onClick={() => setRetryTarget(null)} data-testid="mfa-passwordless-keep">
              <TranslatedText
                stringId="mfa.settings.keepSecondFactor"
                fallback="Keep as second factor"
              />
            </RowButton>
          </RowActions>
        </PasswordlessWarning>
      )}

      {unavailable && (
        <BodyText data-testid="mfa-settings-unavailable">
          <TranslatedText
            stringId="mfa.settings.unavailable"
            fallback="Multi-factor authentication is not available on this server, or you do not have permission to manage it."
          />
        </BodyText>
      )}

      {methods && (
        <>
          <Section>
            <SectionHeading>
              <TranslatedText stringId="mfa.settings.passkeys" fallback="Passkeys" />
            </SectionHeading>
            {methods.webauthn.length === 0 && (
              <BodyText>
                <TranslatedText stringId="mfa.settings.noPasskeys" fallback="No passkeys yet." />
              </BodyText>
            )}
            {methods.webauthn.map(credential =>
              renameId === credential.id ? (
                <FactorRow key={credential.id} data-testid="mfa-passkey-row">
                  <RenameInput
                    value={renameValue}
                    onChange={event => setRenameValue(event.target.value)}
                    data-testid="mfa-rename-input"
                  />
                  <RowActions>
                    <RowButton
                      onClick={submitRename}
                      disabled={!renameValue.trim()}
                      data-testid="mfa-rename-save"
                    >
                      <TranslatedText stringId="general.action.save" fallback="Save" />
                    </RowButton>
                    <RowButton onClick={() => setRenameId(null)} data-testid="mfa-rename-cancel">
                      <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                    </RowButton>
                  </RowActions>
                </FactorRow>
              ) : (
                <FactorRow key={credential.id} data-testid="mfa-passkey-row">
                  <span>
                    {credential.friendlyName ?? (
                      <TranslatedText stringId="mfa.settings.unnamedPasskey" fallback="Passkey" />
                    )}
                    <FactorMeta>
                      <TranslatedText stringId="mfa.settings.addedOn" fallback="added" />{' '}
                      <DateDisplay date={credential.createdAt} />
                    </FactorMeta>
                    <PasskeyCapabilityLine>
                      <PasskeyCapabilities
                        discoverable={credential.discoverable}
                        userVerified={credential.userVerified}
                      />
                    </PasskeyCapabilityLine>
                  </span>
                  <RowActions>
                    <RowButton
                      onClick={() => startRename(credential)}
                      data-testid="mfa-passkey-rename"
                    >
                      <TranslatedText stringId="general.action.rename" fallback="Rename" />
                    </RowButton>
                    <RowButton
                      onClick={() => setRemoveTarget(credential)}
                      data-testid="mfa-passkey-remove"
                    >
                      <TranslatedText stringId="general.action.remove" fallback="Remove" />
                    </RowButton>
                  </RowActions>
                </FactorRow>
              ),
            )}
            <AddPasskeyRow>
              <TextInput
                value={newPasskeyName}
                onChange={event => setNewPasskeyName(event.target.value)}
                placeholder={getTranslation(
                  'mfa.settings.passkeyName.placeholder',
                  'Name (e.g. work laptop)',
                )}
                data-testid="mfa-passkey-name"
              />
              <OutlinedButton onClick={addPasskey} disabled={busy} data-testid="mfa-add-passkey">
                <TranslatedText stringId="mfa.settings.addPasskey" fallback="Add a passkey" />
              </OutlinedButton>
            </AddPasskeyRow>
          </Section>

          <Section>
            <SectionHeading>
              <TranslatedText
                stringId="mfa.settings.authenticatorApp"
                fallback="Authenticator app"
              />
            </SectionHeading>
            {methods.totp?.confirmed ? (
              <FactorRow data-testid="mfa-totp-row">
                <span>
                  <TranslatedText
                    stringId="mfa.settings.totpActive"
                    fallback="An authenticator app is set up."
                  />
                  {methods.totp.confirmedAt && (
                    <FactorMeta>
                      <TranslatedText stringId="mfa.settings.addedOn" fallback="added" />{' '}
                      <DateDisplay date={methods.totp.confirmedAt} />
                    </FactorMeta>
                  )}
                </span>
                {/* removal runs against central, where the seed lives */}
                {!methods.totp.managedCentrally && (
                  <RowActions>
                    <RowButton onClick={() => setShowRemoveTotp(true)} data-testid="mfa-totp-remove">
                      <TranslatedText stringId="general.action.remove" fallback="Remove" />
                    </RowButton>
                  </RowActions>
                )}
              </FactorRow>
            ) : methods.totp === null || methods.totp.managedCentrally ? (
              // facility servers know whether an app is set up (it syncs) but
              // can't run the enrolment, which is central-bound
              <BodyText data-testid="mfa-totp-central-only">
                <TranslatedText
                  stringId="mfa.settings.totpCentralOnly"
                  fallback="Authenticator apps are set up on the central server. Go there, or ask an administrator for an enrolment invite."
                />
              </BodyText>
            ) : totpEnrol ? (
              <>
                <BodyText>
                  <TranslatedText
                    stringId="mfa.totp.enrolInstructions"
                    fallback="Scan this QR code with your authenticator app, then enter the 6-digit code."
                  />
                </BodyText>
                {qrDataUrl && <Qr src={qrDataUrl} alt="" data-testid="mfa-totp-qr" />}
                {manualKey && <ManualKey data-testid="mfa-totp-manual-key">{manualKey}</ManualKey>}
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
                        data-testid="mfa-totp-code"
                      />
                      <FormSubmitButton type="submit" data-testid="mfa-totp-submit">
                        <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                      </FormSubmitButton>
                    </FormGrid>
                  )}
                />
              </>
            ) : (
              <OutlinedButton onClick={beginTotpEnrol} data-testid="mfa-add-totp">
                <TranslatedText
                  stringId="mfa.settings.addTotp"
                  fallback="Set up an authenticator app"
                />
              </OutlinedButton>
            )}
          </Section>
        </>
      )}

      <ConfirmModal
        open={Boolean(removeTarget)}
        title={<TranslatedText stringId="mfa.remove.title" fallback="Remove passkey" />}
        text={
          <TranslatedText
            stringId="mfa.remove.text"
            fallback="You will no longer be able to use this passkey to log in."
          />
        }
        onConfirm={removePasskey}
        onCancel={() => setRemoveTarget(null)}
        data-testid="mfa-remove-confirm"
      />

      <ConfirmModal
        open={showRemoveTotp}
        title={
          <TranslatedText stringId="mfa.removeTotp.title" fallback="Remove authenticator app" />
        }
        text={
          <TranslatedText
            stringId="mfa.removeTotp.text"
            fallback="You will no longer be able to use authenticator app codes to log in."
          />
        }
        onConfirm={removeTotp}
        onCancel={() => setShowRemoveTotp(false)}
        data-testid="mfa-remove-totp-confirm"
      />
    </Modal>
  );
};
