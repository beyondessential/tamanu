import mitt from 'mitt';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { CAN_ACCESS_ALL_FACILITIES, DEVICE_SCOPES } from '@tamanu/constants';
import { ERROR_TYPE, Problem } from '@tamanu/errors';
import { readConfig, writeConfig } from '../config';
import { FetchOptions, LoginResponse, SyncRecord } from './types';
import {
  AuthenticationError,
  forbiddenFacilityMessage,
  generalErrorMessage,
  invalidTokenMessage,
  invalidDeviceMessage,
  OutdatedVersionError,
} from '../error';
import { version } from '/root/package.json';
import { callWithBackoff, sleepAsync } from './utils';
import { CentralConnectionStatus } from '~/types';

type PullMetadataResponse = {
  totalToPull: number;
  pullUntil: number;
};

type RefreshResponse = {
  token?: string;
  refreshToken?: string;
};

const API_PREFIX = 'api';

const diagnoseProblem = (err: AxiosError, isLogin: boolean): Error => {
  const problemJson = err.response?.data || {};
  const problem = Problem.fromJSON(problemJson);

  if (!problem) {
    return new Problem(
      ERROR_TYPE.UNKNOWN,
      'Unknown error',
      err.response?.status,
      err.response?.statusText,
    );
  }

  if (problem.type === ERROR_TYPE.AUTH_QUOTA_EXCEEDED) {
    return new AuthenticationError(invalidDeviceMessage);
  }

  // Auth login errors are handled down the line as we need to access data from the problem object
  if (problem.type.startsWith(ERROR_TYPE.AUTH) && !isLogin) {
    return new AuthenticationError(invalidTokenMessage);
  }

  if (problem.type === ERROR_TYPE.CLIENT_INCOMPATIBLE) {
    return new OutdatedVersionError(problem.extra.get('updateUrl'));
  }

  console.error('Response had non-OK value', problem);
  return problem;
};

export class CentralServerConnection {
  host: string;
  deviceId: string;

  token: string | null;
  refreshToken: string | null;

  emitter = mitt();
  client = axios.create({
    timeout: 45 * 1000,
  });

  async connect(host: string): Promise<void> {
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
    {
      backoff,
      skipAttemptRefresh,
      timeout,
      headers: extraHeaders,
      method = 'GET',
      body,
      ...rest
    }: FetchOptions = {},
  ): Promise<unknown> {
    if (!this.host) {
      throw new AuthenticationError('CentralServerConnection.fetch: not connected to a host yet');
    }
    const url = `${this.host}/${API_PREFIX}/${path}`;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'X-Tamanu-Client': 'Tamanu Mobile',
      'X-Version': version,
      ...(extraHeaders || {}),
    };
    const isLogin = path.startsWith('login');
    try {
      const response = await callWithBackoff(async () => {
        const configAxios: AxiosRequestConfig = {
          url,
          method,
          headers,
          timeout,
          params: query,
          data: body,
          ...rest,
        };
        try {
          const { data } = await this.client.request(configAxios);
          return data;
        } catch (e) {
          const problem = diagnoseProblem(e as AxiosError, isLogin);
          throw problem;
        }
      }, backoff);
      return response;
    } catch (err) {
      // Handle sync disconnection and attempt refresh if possible
      if (err instanceof AuthenticationError && !isLogin) {
        this.emitter.emit('statusChange', CentralConnectionStatus.Disconnected);
        if (this.refreshToken && !skipAttemptRefresh) {
          await this.refresh();
          // Ensure that we don't get stuck in a loop of refreshes if the refresh token is invalid
          const updatedConfig: FetchOptions = {
            backoff,
            skipAttemptRefresh: true,
            timeout,
            headers: extraHeaders,
            method,
            body,
            ...rest,
          };
          return this.fetch(path, query, updatedConfig);
        }
      }
      throw err;
    }
  }

  async get<T>(
    path: string,
    query: Record<string, string | number | boolean>,
    options?: FetchOptions,
  ): Promise<T> {
    return this.fetch(path, query, { ...options, method: 'GET' }) as Promise<T>;
  }

  async post<T>(
    path: string,
    query: Record<string, string | number>,
    body,
    options?: FetchOptions,
  ): Promise<T> {
    const headers = { 'Content-Type': 'application/json', ...(options?.headers || {}) };
    return this.fetch(path, query, { ...options, method: 'POST', headers, body }) as Promise<T>;
  }

  async delete(path: string, query: Record<string, string | number>) {
    return this.fetch(path, query, { method: 'DELETE' });
  }

  async pollUntilTrue(endpoint: string): Promise<unknown> {
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
    const { sessionId, status } = (await this.post(
      'sync',
      {},
      {
        urgent,
        lastSyncedTick,
        facilityIds: [facilityId],
        deviceId: this.deviceId,
        isMobile: true,
      },
    )) as { sessionId?: string; status?: string };

    if (!sessionId) {
      // we're waiting in a queue
      return { status };
    }

    // then, poll the sync/:sessionId/ready endpoint until we get a valid response
    // this is because POST /sync (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persist records from another client
    await this.pollUntilTrue(`sync/${sessionId}/ready`);

    // finally, fetch the new tick from starting the session
    const { startedAtTick } = (await this.get(`sync/${sessionId}/metadata`, {})) as {
      startedAtTick: number;
    };

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
    return this.get<PullMetadataResponse>(`sync/${sessionId}/pull/metadata`, {});
  }

  async pull(sessionId: string, limit = 100, fromId?: string): Promise<SyncRecord[]> {
    const query: { limit: number; fromId?: string } = { limit };
    if (fromId) {
      query.fromId = fromId;
    }
    return await this.get<SyncRecord[]>(`sync/${sessionId}/pull`, query, {
      // allow 5 minutes for the sync pull as it can take a while
      // (the full 5 minutes would be pretty unusual! but just to be safe)
      timeout: 5 * 60 * 1000,
    });
  }

  async push(sessionId: string, changes): Promise<unknown> {
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
    const data = await this.post<RefreshResponse>(
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
      const data = await this.post<LoginResponse>(
        'login',
        {},
        { email, password, deviceId: this.deviceId, scopes: [DEVICE_SCOPES.SYNC_CLIENT] },
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
