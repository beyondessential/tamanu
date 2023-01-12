import mitt from 'mitt';

import { readConfig } from '../config';
import { LoginResponse, SyncRecord, FetchOptions } from './types';
import {
  AuthenticationError,
  OutdatedVersionError,
  RemoteError,
  invalidUserCredentialsMessage,
  invalidTokenMessage,
  generalErrorMessage,
} from '../error';
import { version } from '/root/package.json';

import { callWithBackoff, getResponseJsonSafely, fetchWithTimeout, sleepAsync } from './utils';

const API_VERSION = 1;

export class CentralServerConnection {
  host: string;

  token: string | null;
  expiresAt: number | null;

  refreshToken: string | null;

  emitter = mitt();

  connect(host: string): void {
    this.host = host;
  }

  async fetch(
    path: string,
    query: Record<string, string | number>,
    { backoff, ...config }: FetchOptions = {},
  ): Promise<any> {
    if (!this.host) {
      throw new AuthenticationError('CentralServerConnection.fetch: not connected to a host yet');
    }
    const queryString = Object.entries(query)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const url = `${this.host}/v${API_VERSION}/${path}${queryString && `?${queryString}`}`;
    const extraHeaders = config?.headers || {};
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'X-Tamanu-Client': 'Tamanu Mobile',
      'X-Version': version,
      ...extraHeaders,
    };
    const response = await callWithBackoff(
      () => fetchWithTimeout(url, {
        ...config,
        headers,
      }),
      backoff,
    );

    if (response.status === 401) {
      throw new AuthenticationError(
        path.startsWith('login') ? invalidUserCredentialsMessage : invalidTokenMessage,
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
      throw new RemoteError(error?.message, error, response.status);
    }

    if (!response.ok) {
      const { error } = await getResponseJsonSafely(response);
      // User will be shown a generic error message;
      // log it out here to help with debugging
      console.error('Response had non-OK value', { url, response });
      throw new RemoteError(generalErrorMessage, error, response.status);
    }

    return response.json();
  }

  async get(path: string, query: Record<string, string | number>): Promise<any> {
    return this.fetch(path, query, { method: 'GET' });
  }

  async post(path: string, query: Record<string, string | number>, body, options?: FetchOptions): Promise<any> {
    return this.fetch(path, query, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async delete(path: string, query: Record<string, string | number>): Promise<any> {
    return this.fetch(path, query, { method: 'DELETE' });
  }

  async startSyncSession() {
    return this.post('sync', {}, {});
  }

  async endSyncSession(sessionId: string) {
    return this.delete(`sync/${sessionId}`, {});
  }

  async fetchPullCount(sessionId): Promise<number> {
    // poll the pull count endpoint until we get a valid response - it takes a while for
    // setPullFilter to finish populating the snapshot of changes
    const waitTime = 1000; // retry once per second
    const maxAttempts = 60 * 60 * 12; // for a maximum of 12 hours
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const count = await this.get(`sync/${sessionId}/pull/count`, {});
      if (count !== null) {
        return count;
      }
      await sleepAsync(waitTime);
    }
    throw new Error(`Could not fetch a valid pull count after ${maxAttempts} attempts`);
  }

  async setPullFilter(
    sessionId: string,
    since: number,
    tableNames: string[],
    tablesForFullResync: string[],
  ) {
    const facilityId = await readConfig('facilityId', '');
    const body = {
      since,
      facilityId,
      tablesToInclude: tableNames,
      tablesForFullResync,
      isMobile: true,
    };
    return this.post(`sync/${sessionId}/pullFilter`, {}, body, {});
  }

  async pull(sessionId: string, limit = 100, fromId?: string): Promise<SyncRecord[]> {
    const query: { limit: number; fromId?: string } = { limit };
    if (fromId) {
      query.fromId = fromId;
    }
    return this.get(`sync/${sessionId}/pull`, query);
  }

  async push(
    sessionId: string,
    changes,
    pageNumber: number,
    totalPages: number,
    tableNames: string[],
  ) {
    return this.post(
      `sync/${sessionId}/push`,
      { pageNumber, totalPages },
      { changes, tablesToInclude: tableNames },
    );
  }

  setToken(token: string, expiresAt: number): void {
    this.token = token;
    this.expiresAt = expiresAt;
  }

  clearToken(): void {
    this.token = null;
    this.expiresAt = null;
  }

  setRefreshToken(refreshToken: string): void {
    this.refreshToken = refreshToken;
  }

  clearRefreshToken(): void {
    this.refreshToken = null;
  }

  throwError(err: Error): never {
    // emit error after throwing
    setTimeout(() => {
      this.emitter.emit('error', err);
    }, 1);
    throw err;
  }

  async refresh(): Promise<void> {
    const data = await this.post('refresh', {}, { refreshToken: this.refreshToken });
    if (!data.token) {
      // auth failed in some other regard
      console.warn('Auth failed with an inexplicable error', data);
      throw new AuthenticationError(generalErrorMessage);
    }
    // TODO: decide logic for revolving refresh token is it every time
    if (data.refreshToken) {
      this.setRefreshToken(data.refreshToken);
    }
    this.setToken(data.token, data.expiresAt);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const data = await this.post(
        'login',
        {},
        { email, password },
        { backoff: { maxAttempts: 1 } },
      );

      if (!data.token || !data.refreshToken || !data.user) {
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
