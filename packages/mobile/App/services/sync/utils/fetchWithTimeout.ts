import { FetchOptions } from "..";

const MAX_FETCH_WAIT_TIME = 45 * 1000; // 45 seconds in milliseconds

type TimeoutPromiseResponse = {
  promise: Promise<void>;
  cleanup: () => void;
};

const createTimeoutPromise = (timeout?: number): TimeoutPromiseResponse => {
  let cleanup: () => void;
  const promise: Promise<void> = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('Network request timed out'));
    }, timeout || MAX_FETCH_WAIT_TIME);
    cleanup = (): void => {
      clearTimeout(id);
      resolve();
    };
  });

  return { promise, cleanup };
};

export const fetchWithTimeout = async (url: string, config?: FetchOptions): Promise<Response> => {
  const { timeout, ...otherConfig } = config || {};
  const { cleanup, promise: timeoutPromise } = createTimeoutPromise(timeout);
  try {
    const response = await Promise.race([fetch(url, otherConfig), timeoutPromise]);
    // assert type because timeoutPromise is guaranteed not to resolve unless cleaned up
    return response as Response;
  } finally {
    cleanup();
  }
};
