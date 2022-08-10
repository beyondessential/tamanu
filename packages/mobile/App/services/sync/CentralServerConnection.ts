import mitt from 'mitt';

import { readConfig } from '~/services/config';
import { LoginResponse, SyncRecord } from './types';
import {
  AuthenticationError,
  OutdatedVersionError,
  invalidUserCredentialsMessage,
  invalidTokenMessage,
  generalErrorMessage,
} from '~/services/auth/error';
import { version } from '/root/package.json';

import { callWithBackoff, callWithBackoffOptions } from './utils/callWithBackoff';

const API_VERSION = 1;

const MAX_FETCH_WAIT_TIME = 45 * 1000; // 45 seconds in milliseconds

type TimeoutPromiseResponse = {
  promise: Promise<void>;
  cleanup: () => void;
};
const createTimeoutPromise = (): TimeoutPromiseResponse => {
  let cleanup: () => void;
  const promise: Promise<void> = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('Network request timed out'));
    }, MAX_FETCH_WAIT_TIME);
    cleanup = (): void => {
      clearTimeout(id);
      resolve();
    };
  });
  return { promise, cleanup };
};

const fetchWithTimeout = async (url: string, config?: object): Promise<Response> => {
  const { cleanup, promise: timeoutPromise } = createTimeoutPromise();
  try {
    const response = await Promise.race([fetch(url, config), timeoutPromise]);
    // assert type because timeoutPromise is guaranteed not to resolve unless cleaned up
    return response as Response;
  } finally {
    cleanup();
  }
};

const getResponseJsonSafely = async (response: Response): Promise<Record<string, any>> => {
  try {
    return response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    console.error(e);
    return {};
  }
};

type FetchOptions = {
  backoff?: callWithBackoffOptions;
  [key: string]: any;
};

export class CentralServerConnection {
  host: string;

  token: string | null;

  emitter = mitt();

  connect(host: string): void {
    this.host = host;
  }

  async fetch(
    path: string,
    query: Record<string, string | number>,
    { backoff, ...config }: FetchOptions = {},
  ) {
    if (!this.host) {
      throw new AuthenticationError('CentralServerConnection.fetch: not connected to a host yet');
    }
    const queryString = Object.entries(query)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const url = `${this.host}/v${API_VERSION}/${path}?${queryString}`;
    const extraHeaders = config?.headers || {};
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'X-Tamanu-Client': 'Tamanu Mobile',
      'X-Version': version,
      ...extraHeaders,
    };
    const response = await callWithBackoff(
      () =>
        fetchWithTimeout(url, {
          ...config,
          headers,
        }),
      backoff,
    );

    if (response.status === 401) {
      throw new AuthenticationError(
        path.includes('/login') ? invalidTokenMessage : invalidUserCredentialsMessage,
      );
    }

    if (response.status === 400) {
      const { error } = await getResponseJsonSafely(response);
      if (error?.name === 'InvalidClientVersion') {
        throw new OutdatedVersionError(error.updateUrl);
      }
    }

    if (response.status === 422) {
      const { error } = await getResponseJsonSafely(response);
      throw new Error(error.message);
    }

    if (!response.ok) {
      // User will be shown a generic error message;
      // log it out here to help with debugging
      console.error('Response had non-OK value', { url, response });
      throw new Error(generalErrorMessage);
    }

    return response.json();
  }

  async get(path: string, query: Record<string, string | number>) {
    return this.fetch(path, query, { method: 'GET' });
  }

  async post(path: string, query: Record<string, string | number>, body, options?: FetchOptions) {
    return this.fetch(path, query, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async delete(path: string, query: Record<string, string | number>) {
    return this.fetch(path, query, { method: 'DELETE' });
  }

  async startSyncSession() {
    return this.post('sync', {}, {});
  }

  async endSyncSession(sessionIndex: number) {
    return this.delete(`sync/${sessionIndex}`, {});
  }

  async setPullFilter(sessionIndex: number, fromSessionIndex: number) {
    const facilityId = await readConfig('facilityId', '');
    const body = { fromSessionIndex, facilityId };
    return this.post(`sync/${sessionIndex}/pullFilter`, {}, body, {});
  }

  async pull(sessionIndex: number, limit: number = 100, offset: number = 0): Promise<SyncRecord[]> {
    const query = { limit, offset };
    return this.get(`sync/${sessionIndex}/pull`, query);
  }

  async push(sessionIndex: number, body, pageNumber: number, totalPages: number) {
    return this.post(`sync/${sessionIndex}/push`, { pageNumber, totalPages }, body);
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  throwError(err: Error) {
    // emit error after throwing
    setTimeout(() => {
      this.emitter.emit('error', err);
    }, 1);
    throw err;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const data = await this.post(
        'login',
        {},
        { email, password },
        { backoff: { maxAttempts: 1 } },
      );

      if (!data.token || !data.user) {
        // auth failed in some other regard
        console.warn('Auth failed with an inexplicable error', data);
        throw new AuthenticationError(generalErrorMessage);
      }

      return data;
    } catch (err) {
      this.throwError(err);
    }
  }
}
