import { RemoteUnreachableError } from '@tamanu/errors';

export async function fetchOrThrowIfUnavailable(url, { fetch, timeout = false, ...config } = {}) {
  const abort = new AbortController();
  let timer;
  if (timeout && Number.isFinite(timeout) && !config.signal) {
    timer = setTimeout(() => abort.abort(), timeout);
  }

  try {
    return await fetch(url, { signal: abort.signal, ...config }).finally(() => {
      clearTimeout(timer);
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'Failed to fetch') {
      // apply more helpful message if the server is not available
      throw new RemoteUnreachableError(
        'The server is unavailable. Please check with your system administrator that the address is set correctly, and that it is running',
      );
    }

    // some other unhandled error
    throw new RemoteUnreachableError(e.message);
  }
}
