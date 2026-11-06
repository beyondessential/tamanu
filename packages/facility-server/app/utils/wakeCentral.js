import { log } from '@tamanu/shared/services/logging';

import { CentralServerConnection } from '../sync/CentralServerConnection';

/**
 * Socket messages travel on a connection that does not wake a sleeping central server, so a
 * message that needs central to act on it is preceded by an ordinary HTTP request, which does.
 * A failure is logged and swallowed: socket.io buffers the message and delivers it on reconnect.
 * One attempt only, including the login: a sleeping central answers straight away with a response
 * that starts it, and an unreachable one must not hold the caller on a long retry.
 */
export const wakeCentral = async deviceId => {
  try {
    await new CentralServerConnection({ deviceId }).fetch('whoami', {
      backoff: false,
      preserveBackoffForAuthAttempt: true,
    });
  } catch (error) {
    log.warn(`wakeCentral: central did not answer: ${error}`);
  }
};
