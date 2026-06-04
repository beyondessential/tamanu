import { Box, Divider } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { startRegistration } from '@simplewebauthn/browser';

import {
  BodyText,
  Button,
  DateDisplay,
  OutlinedButton,
  TranslatedText,
} from '../../../../components';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { Colors } from '../../../../constants';
import { useApi } from '../../../../api';
import { useAuth } from '../../../../contexts/Auth';
import { useTranslation } from '../../../../contexts/Translation';

const SectionTitle = styled(Box)`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${Colors.darkestText};
`;

const SectionSubtitle = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
  margin-bottom: 12px;
`;

const StatusLine = styled(BodyText)`
  color: ${Colors.darkText};
  margin-bottom: 12px;
`;

const Actions = styled(Box)`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const InviteBox = styled(Box)`
  margin-top: 12px;
  padding: 12px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  background: ${Colors.white};
  font-size: 13px;
  color: ${Colors.darkText};
  code {
    display: block;
    word-break: break-all;
    margin: 6px 0;
  }
`;

/**
 * Admin view/management of another user's MFA. Read state needs `read
 * UserMfa`; the actions need `write UserMfa`.
 */
export const UserMfaSection = ({ user }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { ability } = useAuth();
  const { getTranslation } = useTranslation();

  const canRead = Boolean(ability?.can('read', 'UserMfa'));
  const canWrite = Boolean(ability?.can('write', 'UserMfa'));

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [invite, setInvite] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data: status } = useQuery({
    queryKey: ['admin-user-mfa', user.id],
    queryFn: () => api.get(`admin/users/${user.id}/mfa`),
    enabled: canRead,
  });

  if (!canRead) return null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-user-mfa', user.id] });

  const reset = async () => {
    setShowResetConfirm(false);
    try {
      await api.delete(`admin/users/${user.id}/mfa`);
      toast.success(
        getTranslation('admin.users.mfa.resetSuccess', 'All authentication methods removed.'),
      );
      refresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const generateInvite = async () => {
    try {
      setInvite(await api.post(`admin/users/${user.id}/mfa/enrolInvite`));
    } catch (error) {
      toast.error(error.message);
    }
  };

  // in-person provisioning: the ceremony runs in this admin's browser, the
  // browser's own dialog offers the hybrid (QR) transport for the user's phone
  const provisionInPerson = async () => {
    setBusy(true);
    try {
      const optionsJSON = await api.post(`admin/users/${user.id}/mfa/webauthn/register-begin`);
      const registrationResponse = await startRegistration({ optionsJSON });
      await api.post(`admin/users/${user.id}/mfa/webauthn/register-finish`, {
        registrationResponse,
      });
      toast.success(getTranslation('admin.users.mfa.provisionSuccess', 'Passkey enrolled.'));
      refresh();
    } catch (error) {
      toast.error(
        getTranslation('mfa.webauthn.error', 'Passkey could not be used. Please try again.'),
      );
    } finally {
      setBusy(false);
    }
  };

  const passkeyCount = status?.webauthn?.length ?? 0;
  const hasTotp = Boolean(status?.totp?.confirmed);
  const hasAnyFactor = passkeyCount > 0 || hasTotp;

  return (
    <>
      <Box mt="20px">
        <Divider sx={{ borderColor: Colors.outline, marginBottom: '20px' }} />
        <SectionTitle data-testid="admin-mfa-title">
          <TranslatedText
            stringId="admin.users.mfa.title"
            fallback="Multi-factor authentication"
          />
        </SectionTitle>
        <SectionSubtitle>
          <TranslatedText
            stringId="admin.users.mfa.subtitle"
            fallback="View and manage this user's authentication methods."
          />
        </SectionSubtitle>

        {status && (
          <StatusLine data-testid="admin-mfa-status">
            <TranslatedText
              stringId="admin.users.mfa.status"
              fallback=":passkeys passkey(s) · authenticator app :totp"
              replacements={{
                passkeys: passkeyCount,
                totp: hasTotp
                  ? getTranslation('admin.users.mfa.totpActive', 'active')
                  : getTranslation('admin.users.mfa.totpNotSetUp', 'not set up'),
              }}
            />
          </StatusLine>
        )}

        {canWrite && (
          <Actions>
            <OutlinedButton onClick={generateInvite} data-testid="admin-mfa-invite">
              <TranslatedText
                stringId="admin.users.mfa.generateInvite"
                fallback="Generate enrolment invite"
              />
            </OutlinedButton>
            <OutlinedButton
              onClick={provisionInPerson}
              disabled={busy}
              data-testid="admin-mfa-provision"
            >
              <TranslatedText
                stringId="admin.users.mfa.provisionInPerson"
                fallback="Set up a passkey in person"
              />
            </OutlinedButton>
            {hasAnyFactor && (
              <Button onClick={() => setShowResetConfirm(true)} data-testid="admin-mfa-reset">
                <TranslatedText stringId="admin.users.mfa.reset" fallback="Reset MFA" />
              </Button>
            )}
          </Actions>
        )}

        {invite && (
          <InviteBox data-testid="admin-mfa-invite-token">
            <TranslatedText
              stringId="admin.users.mfa.inviteIssued"
              fallback="Share this invite token with the user. They redeem it with their password on their own device. It is single-use and expires"
            />{' '}
            <DateDisplay date={invite.expiresAt} timeFormat="default" />
            <code>{invite.token}</code>
            <OutlinedButton
              onClick={() => navigator.clipboard?.writeText(invite.token)}
              data-testid="admin-mfa-invite-copy"
            >
              <TranslatedText stringId="general.action.copy" fallback="Copy" />
            </OutlinedButton>
          </InviteBox>
        )}
      </Box>

      <ConfirmModal
        open={showResetConfirm}
        title={<TranslatedText stringId="admin.users.mfa.reset" fallback="Reset MFA" />}
        text={
          <TranslatedText
            stringId="admin.users.mfa.resetConfirm"
            fallback="This removes every passkey and authenticator app from this account. The user will be able to log in with their password alone (unless their role requires MFA, in which case they will be asked to set up a new method)."
          />
        }
        onConfirm={reset}
        onCancel={() => setShowResetConfirm(false)}
        data-testid="admin-mfa-reset-confirm"
      />
    </>
  );
};
