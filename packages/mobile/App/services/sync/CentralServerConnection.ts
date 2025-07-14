import mitt from 'mitt';
import { readConfig } from '../config';
import { LoginResponse, SyncRecord } from './types';
import { AuthenticationError, forbiddenFacilityMessage, generalErrorMessage } from '../error';
import { version } from '/root/package.json';

import {
  FacilityAndSyncVersionIncompatibleError,
  RemoteCallFailedError,
} from '@tamanu/shared/errors';

import { CentralConnectionStatus } from '~/types';
import { CAN_ACCESS_ALL_FACILITIES } from '~/constants';

import {
  TamanuApi,
  AuthError,
  AuthInvalidError,
  VersionIncompatibleError,
} from '@tamanu/api-client';
import { SERVER_TYPES, SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';

export class CentralServerConnection extends TamanuApi {
  #loginData: LoginResponse;
  emitter = mitt();

  constructor({ deviceId, host }) {
    const url = new URL(host.trim());
    url.pathname = '/api';

    super({
      endpoint: url.toString(),
      agentName: SERVER_TYPES.MOBILE,
      agentVersion: version,
      deviceId,
      defaultRequestConfig: {
        timeout: 10000,
        waitForAuth: true,
        backoff: true,
      },
    });
  }

  async fetch(endpoint: string, options: any = {}, upOptions: any = null): Promise<any> {
    let retryAuth: boolean;
    let query: Record<string, any>;
    let config: any;
    if (!upOptions || options.query || options.retryAuth || options.method) {
      // this is a local style 2-argument call
      retryAuth = options.retryAuth ?? true;
      query = options.query ?? {};
      delete options.retryAuth;
      delete options.query;
      config = options;
    } else {
      // this is an api-client style 3-argument call
      retryAuth = upOptions.retryAuth ?? false;
      delete upOptions.retryAuth;
      query = options;
      config = upOptions;
    }

    if (['login', 'refresh'].includes(endpoint)) {
      retryAuth = false;
    }

    if (retryAuth && !this.hasToken()) {
      await this.connect();
    }

    try {
      const response = await super.fetch(endpoint, query, config);
      return response;
    } catch (err) {
      if (retryAuth && err instanceof AuthError) {
        this.emitter.emit('statusChange', CentralConnectionStatus.Disconnected);
        await this.connect();
        return super.fetch(endpoint, options, upOptions);
      }
      throw err;
    }
  }

  async connect(backoff = { maxAttempts: 1 }, timeout = super.timeout) {
    try {
      await super.refreshToken({
        retryAuth: false,
      });
      return;
    } catch (_) {
      // ignore error
    }
    
    //TODO: This info doesn't exist in config like in facility
    const credentials = await readConfig('syncCredentials');

    try {
      return await this.login(credentials.email, credentials.password, {
        backoff,
        timeout,
      }).then(loginData => {
        return (this.#loginData = loginData);
      });
    } catch (error) {
      if (error instanceof AuthInvalidError) {
        throw new AuthenticationError(error.message);
      }

      if (error instanceof VersionIncompatibleError) {
        throw new FacilityAndSyncVersionIncompatibleError(error.message);
      }

      throw new RemoteCallFailedError(error.message);
    }
  }

  async loginData() {
    if (!this.hasToken() || !this.#loginData) {
      await this.connect();
    }

    return this.#loginData;
  }

  async startSyncSession({ urgent, lastSyncedTick }) {
    const facilityId = await readConfig('facilityId', '');

    // start a sync session (or refresh our position in the queue)
    const { sessionId, status } = await this.fetch('sync', {
      method: 'POST',
      body: {
        urgent,
        lastSyncedTick,
        facilityIds: [facilityId],
        deviceId: this.deviceId,
        isMobile: true,
      },
    });

    if (!sessionId) {
      // we're waiting in a queue
      return { status };
    }
    
    if (await this.streaming()) {
      for await (const { kind, message } of this.stream(() => ({
        endpoint: `sync/${sessionId}/ready/stream`,
      }))) {
        handler: switch (kind) {
          case SYNC_STREAM_MESSAGE_KIND.SESSION_WAITING:
            // still waiting
            break handler;
          case SYNC_STREAM_MESSAGE_KIND.END:
            // includes the new tick from starting the session
            return { sessionId, ...message };
          default:
            log.warn(`Unexpected message kind: ${kind}`);
        }
      }
      throw new Error('Unexpected end of stream');
    }


    // then, poll the sync/:sessionId/ready endpoint until we get a valid response
    // this is because POST /sync (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persist records from another client
    await this.pollUntilOk(`sync/${sessionId}/ready`);

    // finally, fetch the new tick from starting the session
    const { startedAtTick } = await this.fetch(`sync/${sessionId}/metadata`);
    return { sessionId, startedAtTick };
  }

  async endSyncSession(sessionId: string) {
    return this.fetch(`sync/${sessionId}`, { method: 'DELETE' });
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
    await this.fetch(`sync/${sessionId}/pull/initiate`, { method: 'POST', body });

    // poll the pull/ready endpoint until we get a valid response - it takes a while for
    // pull/initiate to finish populating the snapshot of changes
    await this.pollUntilTrue(`sync/${sessionId}/pull/ready`);

    // finally, fetch the count of changes to pull and sync tick the pull runs up until
    return this.fetch(`sync/${sessionId}/pull/metadata`);
  }

  async pull(
    sessionId: string,
    { limit = 100, fromId }: { limit?: number; fromId?: string } = {},
  ): Promise<SyncRecord[]> {
    const query: { limit: number; fromId?: string } = { limit };
    if (fromId) {
      query.fromId = fromId;
    }
    return this.fetch(`sync/${sessionId}/pull`, {
      query,
      // allow 5 minutes for the sync pull as it can take a while
      // (the full 5 minutes would be pretty unusual! but just to be safe)
      timeout: 5 * 60 * 1000,
    });
  }

  async push(sessionId: string, changes: any): Promise<void> {
    return this.fetch(`sync/${sessionId}/push`, { method: 'POST', body: { changes } });
  }

  async completePush(sessionId: string, tablesToInclude: string[]): Promise<void> {
    // first off, mark the push as complete on central
    await this.fetch(`sync/${sessionId}/push/complete`, {
      method: 'POST',
      body: { tablesToInclude, deviceId: this.deviceId },
    });

    // now poll the complete check endpoint until we get a valid response - it takes a while for
    // the pushed changes to finish persisting to the central database
    await this.pollUntilTrue(`sync/${sessionId}/push/complete`);
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
    const data = await this.fetch('refresh', {
      method: 'POST',
      body: { refreshToken: this.refreshToken, deviceId: this.deviceId },
      retryAuth: false,
      backoff: { maxAttempts: 1 },
    });
    if (!data.token || !data.refreshToken) {
      // auth failed in some other regard
      console.warn('Token refresh failed with an inexplicable error', data);
      throw new AuthenticationError(generalErrorMessage);
    }
    this.setRefreshToken(data.refreshToken);
    this.setToken(data.token);
    this.emitter.emit('statusChange', CentralConnectionStatus.Connected);
  }

  // async login(email: string, password: string): Promise<LoginResponse> {
  //   try {
  //     const data = await this.fetch('login', {
  //       method: 'POST',
  //       body: { email, password, deviceId: this.deviceId },
  //       retryAuth: false,
  //       backoff: { maxAttempts: 1 },
  //     });

  //     const facilityId = await readConfig('facilityId', '');
  //     const { token, refreshToken, user, allowedFacilities } = data;
  //     if (
  //       facilityId &&
  //       allowedFacilities !== CAN_ACCESS_ALL_FACILITIES &&
  //       !allowedFacilities.map(f => f.id).includes(facilityId)
  //     ) {
  //       console.warn('User doesnt have permission for this facility: ', facilityId);
  //       throw new AuthenticationError(forbiddenFacilityMessage);
  //     }

  //     if (!token || !refreshToken || !user) {
  //       // auth failed in some other regard
  //       console.warn('Auth failed with an inexplicable error', data);
  //       throw new AuthenticationError(generalErrorMessage);
  //     }
  //     this.emitter.emit('statusChange', CentralConnectionStatus.Connected);
  //     return data;
  //   } catch (err) {
  //     this.throwError(err);
  //   }
  // }
}
