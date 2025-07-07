import { ServerUnavailableError } from './errors.js';

interface FetchOptions extends RequestInit {
  fetch?: typeof globalThis.fetch;
  timeout?: number | false;
}

export async function fetchOrThrowIfUnavailable(url: string, { fetch = globalThis.fetch, timeout = false, ...config }: FetchOptions = {}): Promise<Response> {
  const abort = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  if (timeout && Number.isFinite(timeout) && !config.signal) {
    timer = setTimeout(() => abort.abort(), timeout);
  }

  try {
    return await fetch(url, { signal: abort.signal, ...config }).finally(() => {
      if (timer) clearTimeout(timer);
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

interface Logger {
  warn: (message: string) => void;
}

export async function getResponseErrorSafely(response: Response, logger: Logger = console): Promise<{ error?: { name: string; message: string } }> {
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
