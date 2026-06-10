import React from 'react';
import styled from 'styled-components';

import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../constants';

/**
 * Always-on capability indicators for a single passkey: whether it can be used
 * for passwordless sign-in (from the credProps `discoverable` flag) and whether
 * it verifies the user (from the registration UV flag). Each is shown in all
 * three states — yes / no / unknown — so a key is never silently ambiguous.
 *
 * Passwordless login always requires user verification (a passkey signing in
 * alone must carry two factors), so a key known not to verify the user
 * (`userVerified === false`) is reported as passwordless-incapable regardless of
 * its discoverable flag, with that as the stated reason.
 */

const Wrapper = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  font-size: 12px;
`;

const Chip = styled.span`
  // red to flag a disallowed capability, green when present, muted otherwise
  // (incl. unknown)
  color: ${props => {
    if (props.$danger) return Colors.alert;
    return props.$on ? Colors.green : Colors.midText;
  }};
  white-space: nowrap;
`;

export const PasskeyCapabilities = ({ discoverable, userVerified, 'data-testid': dataTestId }) => (
  <Wrapper data-testid={dataTestId ?? 'passkey-capabilities'}>
    <Chip
      $on={discoverable === true && userVerified !== false}
      $danger={userVerified === false}
      data-testid="passkey-capability-passwordless"
    >
      {userVerified === false ? (
        // passwordless requires UV, so a key that doesn't verify the user can't
        // do it whatever its discoverable flag says
        <TranslatedText
          stringId="mfa.capability.passwordless.notAllowed"
          fallback="Passwordless: not allowed"
        />
      ) : (
        <>
          {discoverable === true && (
            <TranslatedText
              stringId="mfa.capability.passwordless.yes"
              fallback="Passwordless: supported"
            />
          )}
          {discoverable === false && (
            <TranslatedText
              stringId="mfa.capability.passwordless.no"
              fallback="Passwordless: not supported (second factor only)"
            />
          )}
          {discoverable == null && (
            <TranslatedText
              stringId="mfa.capability.passwordless.unknown"
              fallback="Passwordless: unknown"
            />
          )}
        </>
      )}
    </Chip>
    <Chip $on={userVerified === true} data-testid="passkey-capability-uv">
      {userVerified === true && (
        <TranslatedText
          stringId="mfa.capability.userVerification.yes"
          fallback="User verification: yes"
        />
      )}
      {userVerified === false && (
        <TranslatedText
          stringId="mfa.capability.userVerification.no"
          fallback="User verification: no (presence only)"
        />
      )}
      {userVerified == null && (
        <TranslatedText
          stringId="mfa.capability.userVerification.unknown"
          fallback="User verification: unknown"
        />
      )}
    </Chip>
  </Wrapper>
);
