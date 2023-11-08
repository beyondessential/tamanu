import { log } from '../services/logging';

export const getResponseJsonSafely = async response => {
  try {
    return await response.json();
  } catch (e) {
    if (response.headers.get('content-type') === 'text/html') {
      // the server will respond with html instead of json for the
      // nginx "server unavailable" error page; this handles that
      return { error: { message: response.statusText } };
    }
    // log json parsing errors, but still return a valid object
    log.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    return {};
  }
};
