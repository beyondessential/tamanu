import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { Op } from 'sequelize';
import { MFA_CHALLENGE_TYPES } from '@tamanu/constants';
import { InvalidCredentialError, InvalidOperationError, InvalidTokenError } from '@tamanu/errors';

import { originIsUnderRpId } from './webauthn';

/**
 * WebAuthn ceremony plumbing shared by central and facility servers — in-zone
 * facilities run both registration and assertion fully locally (the challenge
 * never touches central), which is what makes passkeys work offline.
 *
 * Each ceremony stores its challenge nonce as a single-use, short-lived
 * mfa_challenges row (the OneTimeLogin pattern). At finish time the nonce is
 * read back out of the response's clientDataJSON to locate and consume the
 * row, then handed to @simplewebauthn as `expectedChallenge`, which performs
 * the real comparison against the signed client data.
 */

const RP_NAME = 'Tamanu';
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;

const challengeExpiry = () => new Date(Date.now() + CHALLENGE_EXPIRY_MS);

function parseClientData(ceremonyResponse) {
  try {
    const clientData = JSON.parse(
      Buffer.from(ceremonyResponse.response.clientDataJSON, 'base64url').toString('utf8'),
    );
    if (typeof clientData.challenge !== 'string' || !clientData.challenge) return null;
    return clientData;
  } catch (_err) {
    return null;
  }
}

/**
 * The web origin the ceremony actually ran at, accepted if it sits under the
 * rpid stem. Ceremonies can legitimately run at any of the deployment's
 * frontends (central admin panel, each facility) and may be verified by a
 * different server than the one serving that frontend (e.g. a facility
 * forwarding to central), so rather than each verifier pinning its own
 * hostname, the stem defines the set of trusted origins — the same rule the
 * browser itself enforces for the rpid. The signed clientDataJSON is what
 * makes the origin trustworthy; verification fails if it was tampered with.
 */
function expectedOriginFor(clientData, rpId) {
  const origin = clientData?.origin;
  if (typeof origin !== 'string' || !originIsUnderRpId(origin, rpId)) {
    throw new InvalidCredentialError('Ceremony origin is not under the relying party ID');
  }
  return origin;
}

/**
 * Atomically consume a stored single-use challenge. Returns the consumed row,
 * or null if there is no live matching challenge (unknown, already used, or
 * expired).
 */
async function consumeChallenge({ models, type, token, userId }) {
  if (!token) return null;
  // expiry is part of the WHERE so an expired challenge isn't needlessly
  // marked used — the single matching live row is claimed atomically
  const [count, rows] = await models.MfaChallenge.update(
    { usedAt: new Date() },
    {
      where: {
        type,
        token,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
        ...(userId !== undefined ? { userId } : {}),
      },
      returning: true,
    },
  );
  if (count === 0) return null;
  return rows[0];
}

/**
 * Start enrolling a passkey: returns registration options for
 * `navigator.credentials.create()` (via `@simplewebauthn/browser`'s
 * `startRegistration`).
 */
export async function beginWebAuthnRegistration({ models, rpId, user, preferredAuthenticatorType }) {
  const existingCredentials = await models.WebAuthnCredential.findAll({
    where: { userId: user.id, rpId },
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpId,
    userID: Buffer.from(user.id, 'utf8'),
    userName: user.email,
    userDisplayName: user.displayName,
    attestationType: 'none',
    // steer the ceremony where the caller knows the device should live (e.g.
    // 'remoteDevice' for admin in-person provisioning, which goes straight to
    // the phone-over-QR/hybrid flow rather than letting the browser dither
    // over the local authenticator)
    ...(preferredAuthenticatorType ? { preferredAuthenticatorType } : {}),
    // stop the same authenticator being enrolled twice
    excludeCredentials: existingCredentials.map(credential => ({
      id: credential.credentialId,
      transports: credential.transports ?? undefined,
    })),
    authenticatorSelection: {
      // discoverable where the authenticator supports it (usernameless login),
      // degrading gracefully on constrained authenticators rather than
      // hard-failing enrolment
      residentKey: 'preferred',
      // biometric/PIN so a passkey is possession + inherence, satisfying MFA
      // by itself
      userVerification: 'required',
    },
  });

  await models.MfaChallenge.create({
    type: MFA_CHALLENGE_TYPES.WEBAUTHN_REGISTER,
    token: options.challenge,
    userId: user.id,
    expiresAt: challengeExpiry(),
  });

  return options;
}

/**
 * Complete enrolment: verify the attestation and store the credential's
 * public half.
 */
export async function finishWebAuthnRegistration({
  models,
  rpId,
  user,
  registrationResponse,
  friendlyName,
}) {
  const clientData = parseClientData(registrationResponse);
  const expectedOrigin = expectedOriginFor(clientData, rpId);
  const token = clientData.challenge;
  const challenge = await consumeChallenge({
    models,
    type: MFA_CHALLENGE_TYPES.WEBAUTHN_REGISTER,
    token,
    userId: user.id,
  });
  // enrolment runs while the user is already authenticated, so failures here
  // are validation errors (422) about the submitted authenticator — never
  // auth errors (401), which the client treats as a dead session and would
  // bounce the user back to login mid-enrolment
  if (!challenge) {
    throw new InvalidOperationError('Unknown, used, or expired registration challenge');
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: token,
      expectedOrigin,
      expectedRPID: rpId,
      requireUserVerification: true,
    });
  } catch (err) {
    throw new InvalidOperationError(`Passkey registration could not be verified: ${err.message}`);
  }
  if (!verification.verified) {
    throw new InvalidOperationError('Passkey registration could not be verified');
  }

  const { credential, aaguid } = verification.registrationInfo;
  return models.WebAuthnCredential.create({
    userId: user.id,
    credentialId: credential.id,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    rpId,
    transports: credential.transports ?? null,
    aaguid: aaguid || null,
    enrolmentOrigin: expectedOrigin,
    friendlyName: friendlyName ?? null,
  });
}

/**
 * Start an assertion (login) ceremony: returns options for
 * `navigator.credentials.get()`. With a known user, their credentials are
 * listed in allowCredentials; without one, an empty list lets discoverable
 * credentials drive a usernameless picker.
 */
export async function beginWebAuthnAssertion({ models, rpId, user }) {
  const credentials = user
    ? await models.WebAuthnCredential.findAll({ where: { userId: user.id, rpId } })
    : [];

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    userVerification: 'required',
    allowCredentials: credentials.map(credential => ({
      id: credential.credentialId,
      transports: credential.transports ?? undefined,
    })),
  });

  await models.MfaChallenge.create({
    type: MFA_CHALLENGE_TYPES.WEBAUTHN_ASSERT,
    token: options.challenge,
    // null for usernameless ceremonies: the user is only known once the
    // authenticator answers
    userId: user?.id ?? null,
    expiresAt: challengeExpiry(),
  });

  return options;
}

/**
 * Complete an assertion: verify the signature against the stored public key
 * and return the credential (the caller resolves the user from it). The
 * signature counter is deliberately passed as 0 — never stored, never
 * enforced; see the WebAuthnCredential model.
 */
export async function finishWebAuthnAssertion({ models, rpId, assertionResponse }) {
  const clientData = parseClientData(assertionResponse);
  const expectedOrigin = expectedOriginFor(clientData, rpId);
  const token = clientData.challenge;
  const challenge = await consumeChallenge({
    models,
    type: MFA_CHALLENGE_TYPES.WEBAUTHN_ASSERT,
    token,
  });
  if (!challenge) {
    throw new InvalidTokenError('Unknown, used, or expired assertion challenge');
  }

  const credential = await models.WebAuthnCredential.findOne({
    where: { credentialId: assertionResponse.id, rpId },
  });
  if (!credential) {
    throw new InvalidCredentialError('Unknown passkey');
  }
  // a user-bound challenge must be answered by that user's credential
  if (challenge.userId && challenge.userId !== credential.userId) {
    throw new InvalidCredentialError('Passkey does not belong to the challenged user');
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: token,
      expectedOrigin,
      expectedRPID: rpId,
      credential: {
        id: credential.credentialId,
        publicKey: isoBase64URL.toBuffer(credential.publicKey),
        counter: 0,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    throw new InvalidCredentialError(`Passkey assertion could not be verified: ${err.message}`);
  }
  if (!verification.verified) {
    throw new InvalidCredentialError('Passkey assertion could not be verified');
  }

  await credential.update({ lastUsedAt: new Date() });
  return credential;
}
