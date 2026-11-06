import { log } from '@tamanu/shared/services/logging';

import { CentralServerConnection } from '../sync/CentralServerConnection';

/**
 * Socket messages travel on a connection that does not wake a sleeping central server, so a
 * message that needs central to act on it is preceded by an ordinary HTTP request, which does.
 * A failure is logged and swallowed: socket.io buffers the message and delivers it on reconnect.
 */
export const wakeCentral = async deviceId => {
  try {
    await new CentralServerConnection({ deviceId }).whoami();
  } catch (error) {
    log.warn(`wakeCentral: central did not answer: ${error}`);
  }
};
