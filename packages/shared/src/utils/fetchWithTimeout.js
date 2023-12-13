import AbortController from 'abort-controller';
import fetch from 'node-fetch';

export const fetchWithTimeout = async (url, { timeout, ...params } = {}, fetchImpl = fetch) => {
  let controller;
  let response;
  let timeoutHandle;
  if (Number.isFinite(timeout)) {
    controller = new AbortController();
    timeoutHandle = setTimeout(() => {
      controller.abort();
    }, timeout);
  }
  try {
    response = await fetchImpl(url, {
      ...params,
      signal: controller?.signal,
    });
  } finally {
    clearTimeout(timeoutHandle); // succeeds even with an undefined handle
  }
  return response;
};
