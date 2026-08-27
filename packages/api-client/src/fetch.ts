import { RemoteUnreachableError } from '@tamanu/errors';

import type { LoggerType } from './TamanuApi';

export interface BaseFetchOptions extends RequestInit {
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

/** Describe why a fetch never got a response.
 *
 * `fetch` reports every transport failure as a bare `TypeError: fetch failed` and puts the real
 * reason further down the cause chain, which for a hostname resolving to several addresses
 * (`localhost` being both `::1` and `127.0.0.1`) is an AggregateError holding one error per
 * address tried.
 */
function describeTransportFailure(error: Error): string {
  let cause = error;
  while (cause.cause instanceof Error) {
    cause = cause.cause;
  }

  if (cause instanceof AggregateError && cause.errors?.length) {
    return cause.errors.map((each: Error) => each.message).join('; ');
  }
  return cause.message || error.message;
}

export async function fetchOrThrowIfUnavailable(
  url: string,
  { fetch: fetchFn = fetch, timeout = false, ...config }: BaseFetchOptions = {},
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
      throw new RemoteUnreachableError(
        'The server is unavailable. Please check with your system administrator that the address is set correctly, and that it is running',
      );
    }

    // some other unhandled error: report the reason underneath rather than the bare
    // `fetch failed`, which doesn't say what went wrong, and keep the cause for the log.
    throw new RemoteUnreachableError(describeTransportFailure(e)).withCause(e);
  }
}

export async function getResponseErrorSafely(
  response: Response,
  logger: LoggerType = console,
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
