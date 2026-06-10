import { CentralServerConnection } from './CentralServerConnection';

/**
 * The shared central connection used for forwarding requests on behalf of
 * end clients (MFA completions, invite redemption, forwarder headers on
 * logins). One per process: it holds the facility's own central session —
 * whose device carries the facility_server scope where granted — so forwards
 * don't pay a fresh sync-login round trip to central on every user login.
 * The connection re-authenticates itself on expiry via its own retryAuth.
 */
let connection = null;

export function getForwarderConnection(deviceId) {
  if (!connection) {
    connection = new CentralServerConnection({ deviceId });
  }
  return connection;
}
