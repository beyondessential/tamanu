import { RemoteUnreachableError } from '@tamanu/errors';
import { fetch, type FetchOptions, Response } from '@passcod/faith';

import type { LoggerType } from './TamanuApi';

export interface BaseFetchOptions extends FetchOptions {
  fetch?: typeof fetch;
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
  { fetch: fetchFn = fetch, ...config }: BaseFetchOptions = {},
): Promise<Response> {
  try {
    return await fetchFn(url, config);
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
