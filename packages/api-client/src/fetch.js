import { ServerUnavailableError } from './errors';

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
      throw new ServerUnavailableError(
        'The server is unavailable. Please check with your system administrator that the address is set correctly, and that it is running',
      );
    }

    throw e; // some other unhandled error
  }
}

export async function getResponseErrorSafely(response, logger = console) {
  try {
    const data = await response.text();
    if (data.length === 0) {
      return {};
    }

    return JSON.parse(data);
  } catch (e) {
    // log json parsing errors, but still return a valid object
    logger.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    return {
      error: { name: 'JSONParseError', message: `Error parsing JSON: ${e}` },
    };
  }
}
