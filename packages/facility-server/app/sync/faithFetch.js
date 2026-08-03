import { log } from '@tamanu/shared/services/logging';

// loaded on first use so TAMANU_DISABLE_FAITH_FETCH also covers the binding failing to load
let faith;

export const faithFetch = async (url, options) => {
  const { fetch, ERROR_CODES } = await (faith ??= import('@passcod/faith'));
  try {
    return await fetch(url, options);
  } catch (error) {
    // body stream read failures arrive without a code
    if (!Object.hasOwn(ERROR_CODES, error.code ?? '')) throw error;

    // the message is the whole rust error chain, too long for the error sync stores
    log.debug('faithFetch: request failed', { url, code: error.code, detail: error.message });
    throw new Error(`faith: ${error.code}`, { cause: error });
  }
};
