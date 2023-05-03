import { log } from '../services/logging';

export const getResponseJsonSafely = async response => {
  try {
    return await response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    log.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    return {};
  }
};
