import { createSecretKey } from 'node:crypto';
import config from 'config';
import * as jose from 'jose';

import { DEVICE_SCOPES, JWT_TOKEN_TYPES } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/errors';
import { ipMatchesCidrList, isValidIpAddress } from '@tamanu/utils';

/**
 * The end-client IP for IP-policy decisions (auth.ipAllowlist,
 * auth.mfa.ipExempt).
 *
 * For facility-mediated logins central only sees the facility server's
 * address, so the facility captures the client IP at first contact and
 * forwards it in X-Tamanu-Client-Ip, authenticated by its own central session
 * in X-Tamanu-Forwarder-Auth. The forwarded IP is honoured ONLY when that
 * token verifies and its device carries the facility_server scope (which is
 * permission-gated at registration — see Device.ensureRegistration);
 * otherwise it is ignored and the connection's own address is used. A browser
 * asserting the header gets evaluated as itself: fail-closed.
 */

export const CLIENT_IP_HEADER = 'x-tamanu-client-ip';
export const FORWARDER_AUTH_HEADER = 'x-tamanu-forwarder-auth';

export async function resolveClientIp(req) {
  const forwardedIp = req.get(CLIENT_IP_HEADER);
  const forwarderToken = req.get(FORWARDER_AUTH_HEADER);
  // defence in depth: never let a non-IP header value flow downstream, even
  // though the CIDR matcher would reject it anyway
  if (!forwardedIp || !isValidIpAddress(forwardedIp) || !forwarderToken) return req.ip;

  try {
    const { payload } = await jose.jwtVerify(
      forwarderToken,
      createSecretKey(new TextEncoder().encode(config.auth.secret)),
      { issuer: config.canonicalHostName, audience: JWT_TOKEN_TYPES.ACCESS },
    );
    const device = payload.deviceId
      ? await req.store.models.Device.findByPk(payload.deviceId)
      : null;
    if (device?.scopes?.includes(DEVICE_SCOPES.FACILITY_SERVER)) {
      return forwardedIp;
    }
  } catch (_err) {
    // fall through: an invalid forwarder credential is treated as absent
  }
  return req.ip;
}

/**
 * The login-level gate: with a non-empty auth.ipAllowlist, refuse logins from
 * outside every listed range.
 */
export async function assertIpAllowed(req, clientIp) {
  const allowlist = await req.settings.get('auth.ipAllowlist');
  if (!Array.isArray(allowlist) || allowlist.length === 0) return;
  if (!ipMatchesCidrList(clientIp, allowlist)) {
    throw new ForbiddenError('Logins are not allowed from this network');
  }
}

/**
 * Whether this client skips the second factor (auth.mfa.ipExempt). Empty
 * list: no one is exempt.
 */
export async function isIpExempt(req, clientIp) {
  const exempt = await req.settings.get('auth.mfa.ipExempt');
  return ipMatchesCidrList(clientIp, exempt);
}
