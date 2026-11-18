type SocketListener = (...args: any[]) => void;

/** The parts of a socket.io client socket this needs. */
interface ReconnectableSocket {
  readonly active: boolean;
  connect(): unknown;
  on(event: string, listener: SocketListener): unknown;
  off(event: string, listener: SocketListener): unknown;
}

const FIRST_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 60_000;

/**
 * socket.io retries a connection by itself only after a transport failure. When the server refuses
 * the handshake or ends the connection, as a server requiring an access token does when the token
 * is missing or expires, the client has to reconnect on its own. This does so, refreshing the
 * credentials first, with one retry pending at a time and a delay that grows while retries fail.
 *
 * Returns a function that stops retrying; call it before disconnecting the socket on purpose.
 */
export const keepSocketConnected = (
  socket: ReconnectableSocket,
  { refreshCredentials }: { refreshCredentials?: () => Promise<unknown> } = {},
): (() => void) => {
  let delay = FIRST_RETRY_DELAY_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let isStopped = false;

  const retry = async () => {
    timer = undefined;
    try {
      await refreshCredentials?.();
    } catch {
      // The handshake is refused for want of a valid token, which schedules the next retry
    }
    if (!isStopped && !socket.active) socket.connect();
  };

  const scheduleRetry = () => {
    if (isStopped || socket.active || timer) return;
    timer = setTimeout(retry, delay);
    delay = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
  };

  const resetDelay = () => {
    delay = FIRST_RETRY_DELAY_MS;
  };

  socket.on('connect_error', scheduleRetry);
  socket.on('disconnect', scheduleRetry);
  socket.on('connect', resetDelay);

  return () => {
    isStopped = true;
    clearTimeout(timer);
    socket.off('connect_error', scheduleRetry);
    socket.off('disconnect', scheduleRetry);
    socket.off('connect', resetDelay);
  };
};
