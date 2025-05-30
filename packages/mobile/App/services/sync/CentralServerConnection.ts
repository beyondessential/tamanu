import mitt from 'mitt';
import { v4 as uuidv4 } from 'uuid';
import { readConfig, writeConfig } from '../config';
import { FetchOptions, LoginResponse, SyncRecord } from './types';
import {
  AuthenticationError,
  forbiddenFacilityMessage,
  generalErrorMessage,
  invalidTokenMessage,
  invalidUserCredentialsMessage,
  OutdatedVersionError,
  RemoteError,
} from '../error';
import { version } from '/root/package.json';
import { callWithBackoff, fetchWithTimeout, getResponseJsonSafely, sleepAsync } from './utils';
import { CentralConnectionStatus } from '~/types';
import { CAN_ACCESS_ALL_FACILITIES } from '~/constants';

const API_PREFIX = 'api';

const fetchAndParse = async (
  url: string,
  config: FetchOptions,
  isLogin: boolean,
): Promise<Record<string, unknown>> => {
  const response = await fetchWithTimeout(url, config);
  if (response.status === 401) {
    throw new AuthenticationError(isLogin ? invalidUserCredentialsMessage : invalidTokenMessage);
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
};

export class CentralServerConnection {
  host: string;
  deviceId: string;

  token: string | null;
  refreshToken: string | null;

  emitter = mitt();

  async connect(host: string): void {
    this.host = host;
    this.deviceId = await readConfig('deviceId');

    if (!this.deviceId) {
      this.deviceId = `mobile-${uuidv4()}`;
      await writeConfig('deviceId', this.deviceId);
    }
  }

  async fetch(
    path: string,
    query: Record<string, string | number | boolean>,
    { backoff, skipAttemptRefresh, ...config }: FetchOptions = {},
  ): Promise<any> {
    if (!this.host) {
      throw new AuthenticationError('CentralServerConnection.fetch: not connected to a host yet');
    }

    const queryString = Object.entries(query)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const url = `${this.host}/${API_PREFIX}/${path}${queryString && `?${queryString}`}`;
    const extraHeaders = config?.headers || {};
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'X-Tamanu-Client': 'Tamanu Mobile',
      'X-Version': version,
      ...extraHeaders,
    };
    const isLogin = path.startsWith('login');
    try {
      const response = await callWithBackoff(
        async () => fetchAndParse(url, { ...config, headers }, isLogin),
        backoff,
      );
      return response;
    } catch (err) {
      // Handle sync disconnection and attempt refresh if possible

      if (err instanceof AuthenticationError && !isLogin) {
        this.emitter.emit('statusChange', CentralConnectionStatus.Disconnected);
        if (this.refreshToken && !skipAttemptRefresh) {
          await this.refresh();
          // Ensure that we don't get stuck in a loop of refreshes if the refresh token is invalid
          const updatedConfig = { ...config, skipAttemptRefresh: true };
          return this.fetch(path, query, updatedConfig);
        }
      }
      throw err;
    }
  }

  async get(
    path: string,
    query: Record<string, string | number | boolean>,
    options?: FetchOptions,
  ) {
    return this.fetch(path, query, { ...options, method: 'GET' });
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

  async pollUntilTrue(endpoint: string): Promise<void> {
    // poll the provided endpoint until we get a valid response
    const waitTime = 1000; // retry once per second
    const maxAttempts = 60 * 60 * 12; // for a maximum of 12 hours
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await this.get(endpoint, {});
      if (response) {
        return response;
      }
      await sleepAsync(waitTime);
    }
    throw new Error(`Did not get a truthy response after ${maxAttempts} attempts for ${endpoint}`);
  }

  async startSyncSession({ urgent, lastSyncedTick }) {
    const facilityId = await readConfig('facilityId', '');

    // start a sync session (or refresh our position in the queue)
    const { sessionId, status } = await this.post(
      'sync',
      {},
      {
        urgent,
        lastSyncedTick,
        facilityIds: [facilityId],
        deviceId: this.deviceId,
        isMobile: true,
      },
    );

    if (!sessionId) {
      // we're waiting in a queue
      return { status };
    }

    // then, poll the sync/:sessionId/ready endpoint until we get a valid response
    // this is because POST /sync (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persist records from another client
    await this.pollUntilTrue(`sync/${sessionId}/ready`);

    // finally, fetch the new tick from starting the session
    const { startedAtTick } = await this.get(`sync/${sessionId}/metadata`, {});

    return { sessionId, startedAtTick };
  }

  async endSyncSession(sessionId: string) {
    return this.delete(`sync/${sessionId}`, {});
  }

  async initiatePull(
    sessionId: string,
    since: number,
    tableNames: string[],
    tablesForFullResync: string[],
  ): Promise<{ totalToPull: number; pullUntil: number }> {
    const facilityId = await readConfig('facilityId', '');
    const body = {
      since,
      facilityIds: [facilityId],
      tablesToInclude: tableNames,
      tablesForFullResync,
      deviceId: this.deviceId,
    };
    await this.post(`sync/${sessionId}/pull/initiate`, {}, body, {});

    // poll the pull/ready endpoint until we get a valid response - it takes a while for
    // pull/initiate to finish populating the snapshot of changes
    await this.pollUntilTrue(`sync/${sessionId}/pull/ready`);

    // finally, fetch the count of changes to pull and sync tick the pull runs up until
    return this.get(`sync/${sessionId}/pull/metadata`, {});
  }

  async pull(sessionId: string, limit = 100, fromId?: string): Promise<SyncRecord[]> {
    const query: { limit: number; fromId?: string } = { limit };
    if (fromId) {
      query.fromId = fromId;
    }
    return this.get(`sync/${sessionId}/pull`, query, {
      // allow 5 minutes for the sync pull as it can take a while
      // (the full 5 minutes would be pretty unusual! but just to be safe)
      timeout: 5 * 60 * 1000,
    });
  }

  async push(sessionId: string, changes): Promise<void> {
    return this.post(`sync/${sessionId}/push`, {}, { changes });
  }

  async completePush(sessionId: string, tablesToInclude: string[]): Promise<void> {
    // first off, mark the push as complete on central
    await this.post(
      `sync/${sessionId}/push/complete`,
      {},
      { tablesToInclude, deviceId: this.deviceId },
    );

    // now poll the complete check endpoint until we get a valid response - it takes a while for
    // the pushed changes to finish persisting to the central database
    const waitTime = 1000; // retry once per second
    const maxAttempts = 60 * 60 * 12; // for a maximum of 12 hours
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isComplete = await this.get(`sync/${sessionId}/push/complete`, {});
      if (isComplete) {
        return;
      }
      await sleepAsync(waitTime);
    }
    throw new Error(`Could not fetch if push has been completed after ${maxAttempts} attempts`);
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
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
    const data = await this.post(
      'refresh',
      {},
      { refreshToken: this.refreshToken, deviceId: this.deviceId },
      { skipAttemptRefresh: true, backoff: { maxAttempts: 1 } },
    );
    if (!data.token || !data.refreshToken) {
      // auth failed in some other regard
      console.warn('Token refresh failed with an inexplicable error', data);
      throw new AuthenticationError(generalErrorMessage);
    }
    this.setRefreshToken(data.refreshToken);
    this.setToken(data.token);
    this.emitter.emit('statusChange', CentralConnectionStatus.Connected);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const data = await this.post(
        'login',
        {},
        { email, password, deviceId: this.deviceId },
        { backoff: { maxAttempts: 1 } },
      );

      const facilityId = await readConfig('facilityId', '');
      const { token, refreshToken, user, allowedFacilities } = data;
      if (
        facilityId &&
        allowedFacilities !== CAN_ACCESS_ALL_FACILITIES &&
        !allowedFacilities.map(f => f.id).includes(facilityId)
      ) {
        console.warn('User doesnt have permission for this facility: ', facilityId);
        throw new AuthenticationError(forbiddenFacilityMessage);
      }

      if (!token || !refreshToken || !user) {
        // auth failed in some other regard
        console.warn('Auth failed with an inexplicable error', data);
        throw new AuthenticationError(generalErrorMessage);
      }
      this.emitter.emit('statusChange', CentralConnectionStatus.Connected);
      return data;
    } catch (err) {
      this.throwError(err);
    }
  }
}
