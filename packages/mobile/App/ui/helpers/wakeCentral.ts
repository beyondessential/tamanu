import type { CentralServerConnection } from '~/services/sync/CentralServerConnection';

/**
 * Socket messages travel on a connection that does not wake a sleeping central server, so a
 * message that needs central to act on it is preceded by an ordinary HTTP request, which does.
 * A failure is logged and swallowed: socket.io buffers the message and delivers it on reconnect.
 * One attempt only, because an unreachable central must not hold the caller on a long retry.
 */
export const wakeCentral = async (centralServer: CentralServerConnection): Promise<void> => {
  try {
    await centralServer.get(
      'whoami',
      {},
      { backoff: { maxAttempts: 1 }, skipAttemptRefresh: true },
    );
  } catch (error) {
    console.warn(`wakeCentral: central did not answer: ${error}`);
  }
};
