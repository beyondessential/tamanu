import { ServerUnavailableError } from './errors';

import type { LoggerType } from './TamanuApi';

export interface FetchOptions extends RequestInit {
  fetch?: typeof fetch;
  timeout?: number | false;
}

export interface ResponseError {
  name: string;
  message: string;
}

export interface ResponseErrorData {
  error?: ResponseError;
  [key: string]: any;
}

export async function fetchOrThrowIfUnavailable(
  url: string,
  { fetch: fetchFn = fetch, timeout = false, ...config }: FetchOptions = {}
): Promise<Response> {
  const abort = new AbortController();
  let timer: NodeJS.Timeout | number | undefined;
  
  if (timeout && Number.isFinite(timeout) && !config.signal) {
    timer = setTimeout(() => abort.abort(), timeout);
  }

  try {
    return await fetchFn(url, { signal: abort.signal, ...config }).finally(() => {
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

export async function getResponseErrorSafely(
  response: Response,
  logger: LoggerType = console
): Promise<ResponseErrorData> {
  try {
    const data = await response.text();
    if (data.length === 0) {
      return {};
    }

    return JSON.parse(data) as ResponseErrorData;
  } catch (e) {
    // log json parsing errors, but still return a valid object
    logger.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    return {
      error: { name: 'JSONParseError', message: `Error parsing JSON: ${e}` },
    };
  }
}