import { fetch, type RequestInit } from 'undici';

export const fetchWithTimeout = async (
  url: string,
  options?: RequestInit & { timeout?: number },
  fetcher = fetch
) => {
  const controller = new AbortController();
  const { timeout, ...fetchOptions } = options || {};
  let timeoutHandle: NodeJS.Timeout | undefined;

  if (Number.isFinite(timeout)) {
    timeoutHandle = setTimeout(() => controller.abort(), timeout);
  }

  try {
    const response = await fetcher(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutHandle);
  }
};
