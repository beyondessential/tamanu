import { ServerUnavailableError } from './errors';

export interface ResponseError {
  name: string;
  message: string;
}

export async function fetchOrThrowIfUnavailable(
  url: Request | string | URL,
  config?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(url, config);
    return response;
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
): Promise<{ error: ResponseError }> {
  try {
    return await response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    // eslint-disable-next-line no-console
    console.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    return {
      error: { name: 'JSONParseError', message: `Error parsing JSON: ${e}` },
    };
  }
}
