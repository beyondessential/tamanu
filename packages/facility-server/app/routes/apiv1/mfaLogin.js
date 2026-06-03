import express from 'express';
import asyncHandler from 'express-async-handler';

import { ReadSettings } from '@tamanu/settings';

import { CentralServerConnection } from '../../sync';
import { finaliseCentralLogin, sendFacilityLoginResponse } from '../../middleware/auth';

/**
 * MFA login completion at a facility. The facility login path tries central
 * first; when central pauses the login (`mfaPending`), the client completes
 * it through these routes, which forward to central verbatim — the pending
 * token travels in the body precisely so that forwarding works.
 *
 * Ceremony steps (begin/enrol) pass central's response straight through.
 * Terminal steps get central's full login payload back, which proves the
 * second factor passed; the facility then lands the user locally and answers
 * with its own login response shape (facility token, availableFacilities),
 * exactly as the plain login path would have.
 *
 * Running WebAuthn assertions locally against the synced public keys (the
 * offline login path) is a separate, facility-local flow — these routes are
 * the online path.
 */

const forwardThrough = endpoint =>
  asyncHandler(async (req, res) => {
    const { deviceId } = req;
    // no permission needed: the mfa_login token in the body is the authority
    req.flagPermissionChecked();

    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.forwardRequest(req, endpoint);

    res.send(response);
  });

const forwardAndFinalise = endpoint =>
  asyncHandler(async (req, res) => {
    const { models, settings, deviceId } = req;
    // no permission needed: the mfa_login token in the body is the authority
    req.flagPermissionChecked();

    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.forwardRequest(req, endpoint);

    // central only sends the full payload once the factor has been satisfied
    const globalSettings =
      settings?.global ?? (typeof settings?.get === 'function' ? settings : new ReadSettings(models));
    const loginResult = await finaliseCentralLogin({
      models,
      settings: globalSettings,
      deviceId: req.body?.deviceId,
      response,
    });
    await sendFacilityLoginResponse(req, res, { deviceId: req.body?.deviceId, loginResult });
  });

export const mfaLogin = express.Router();

mfaLogin.post('/totp', forwardAndFinalise('mfa/login/totp'));
mfaLogin.post('/webauthn/assert-begin', forwardThrough('mfa/login/webauthn/assert-begin'));
mfaLogin.post('/webauthn/assert-finish', forwardAndFinalise('mfa/login/webauthn/assert-finish'));
mfaLogin.post('/webauthn/register-begin', forwardThrough('mfa/login/webauthn/register-begin'));
mfaLogin.post('/webauthn/register-finish', forwardAndFinalise('mfa/login/webauthn/register-finish'));
mfaLogin.post('/totp/enrol', forwardThrough('mfa/login/totp/enrol'));
mfaLogin.post('/totp/confirm', forwardAndFinalise('mfa/login/totp/confirm'));
