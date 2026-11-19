import config from 'config';

import { log } from '@tamanu/shared/services/logging';

import { CentralServerConnection } from '../sync/CentralServerConnection';

/**
 * Socket messages travel on a connection that does not wake a sleeping central server, so a
 * message that needs central to act on it is preceded by an ordinary HTTP request, which does.
 * A failure is logged and swallowed: socket.io buffers the message and delivers it on reconnect.
 *
 * One attempt each at the login and the request that follows it, both bounded by the sync
 * timeout, because an unreachable central must not hold the caller on a long retry. Logging in
 * explicitly is what bounds it: connect() otherwise retries on the sync backoff, and passes a
 * timeout the client does not have, which leaves the login running with no deadline at all.
 */
export const wakeCentral = async deviceId => {
  try {
    const centralServer = new CentralServerConnection({ deviceId });
    await centralServer.connect(false, config.sync.timeout);
    await centralServer.fetch('whoami', { backoff: false, retryAuth: false });
  } catch (error) {
    log.warn(`wakeCentral: central did not answer: ${error}`);
  }
};
