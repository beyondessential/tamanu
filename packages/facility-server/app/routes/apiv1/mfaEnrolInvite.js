import express from 'express';

import { forwardThrough } from './mfaLogin';

/**
 * MFA enrolment-invite redemption at a facility: pure pass-throughs to
 * central, which owns invites and the enrol session. Pre-auth — the user
 * isn't logged in; the invite token + password (then the enrol-session token,
 * in the body so forwarding works) are the authority, verified by central.
 */
export const mfaEnrolInvite = express.Router();

mfaEnrolInvite.post('/redeem', forwardThrough('mfa/enrolInvite/redeem'));
mfaEnrolInvite.post(
  '/webauthn/register-begin',
  forwardThrough('mfa/enrolInvite/webauthn/register-begin'),
);
mfaEnrolInvite.post(
  '/webauthn/register-finish',
  forwardThrough('mfa/enrolInvite/webauthn/register-finish'),
);
mfaEnrolInvite.post('/totp/enrol', forwardThrough('mfa/enrolInvite/totp/enrol'));
mfaEnrolInvite.post('/totp/confirm', forwardThrough('mfa/enrolInvite/totp/confirm'));
