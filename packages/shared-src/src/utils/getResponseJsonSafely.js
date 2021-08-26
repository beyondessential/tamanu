import { log } from 'shared/services/logging';

export const getResponseJsonSafely = async response => {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch (e) {
    // log json parsing errors, but still return a valid object
    log.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    log.warn(body);
    return {};
  }
};
