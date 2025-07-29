import mitt from 'mitt';
import { readConfig } from '../config';
import { version } from '/root/package.json';

import {
  SERVER_TYPES,
  CAN_ACCESS_ALL_FACILITIES,
} from '@tamanu/constants';
import {
  TamanuApi,
  AuthError,
  AuthInvalidError,
  VersionIncompatibleError,
  LoginResponse,
} from '@tamanu/api-client';
import {
  BadAuthenticationError,
  FacilityAndSyncVersionIncompatibleError,
  RemoteCallFailedError,
} from '@tamanu/shared/errors';
import { CentralConnectionStatus, SyncConnectionParameters } from '~/types';
import { FetchOptions, SyncRecord } from './types';

export class CentralServerConnection extends TamanuApi {
  #loginData: LoginResponse;
  emitter = mitt();

  constructor() {
    super({
      agentName: SERVER_TYPES.MOBILE,
      agentVersion: version,
      defaultRequestConfig: {
        timeout: 10000,
        waitForAuth: true,
        backoff: true,
      },
    });
  }

  async fetch(
    endpoint: string,
    query: Record<string, any> = {},
    options: FetchOptions = {},
  ): Promise<any> {
    let retryAuth = options.retryAuth ?? true;
    delete options.retryAuth;

    if (['login', 'refresh'].includes(endpoint)) {
      retryAuth = false;
    }

    if (retryAuth && !this.hasToken()) {
      await this.connect();
    }

    try {
      const response = await super.fetch(endpoint, query, options);
      return response;
    } catch (err) {
      if (retryAuth && err instanceof AuthError) {
        this.emitter.emit('statusChange', CentralConnectionStatus.Disconnected);
        await this.connect();
        return super.fetch(endpoint, query, options);
      }
      throw err;
    }
  }

  setServer(server: string, deviceId?: string) {
    const url = new URL(server);
    url.pathname = '/api';
    this.setEndpoint(url.toString(), deviceId);
  }

  async connect(params?: SyncConnectionParameters, backoff = { maxAttempts: 1 }, timeout = 10000) {
    try {
      await super.refreshToken({
        retryAuth: false,
      } as FetchOptions);
      return;
    } catch (_) {
      // ignore error
    }

    const facilityId = await readConfig('facilityId', '');

    try {
      console.log('params')
      // #TODO: get a failure here after session is timed out or something
      return await this.login(params.email, params.password, {
        backoff,
        timeout,
      }).then(loginData => {
        const { allowedFacilities } = loginData;
        if (
          facilityId &&
          allowedFacilities !== CAN_ACCESS_ALL_FACILITIES &&
          !allowedFacilities.map(f => f.id).includes(facilityId)
        ) {
          console.warn('User doesnt have permission for this facility: ', facilityId);
          throw new BadAuthenticationError('You dont have access to this facility');
        }
        this.emitter.emit('statusChange', CentralConnectionStatus.Connected);
        return (this.#loginData = loginData);
      });
    } catch (error) {
      console.log('an error', error)
      if (error instanceof AuthInvalidError) {
        throw new BadAuthenticationError(error.message);
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
    const { sessionId, status } = await this.post('sync', {
      urgent,
      lastSyncedTick,
      facilityIds: [facilityId],
      deviceId: this.deviceId,
      isMobile: true,
    });

    if (!sessionId) {
      // we're waiting in a queue
      return { status };
    }

    // then, poll the sync/:sessionId/ready endpoint until we get a valid response
    // this is because POST /sync (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persist records from another client
    await this.pollUntilOk(`sync/${sessionId}/ready`);

    // finally, fetch the new tick from starting the session
    const { startedAtTick } = await this.get(`sync/${sessionId}/metadata`);
    return { sessionId, startedAtTick };
  }

  async endSyncSession(sessionId: string) {
    return this.delete(`sync/${sessionId}`);
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
    await this.post(`sync/${sessionId}/pull/initiate`, body);

    // poll the pull/ready endpoint until we get a valid response - it takes a while for
    // pull/initiate to finish populating the snapshot of changes
    await this.pollUntilOk(`sync/${sessionId}/pull/ready`);

    // finally, fetch the count of changes to pull and sync tick the pull runs up until
    return this.get(`sync/${sessionId}/pull/metadata`);
  }

  async pull(
    sessionId: string,
    { limit = 100, fromId }: { limit?: number; fromId?: string } = {},
  ): Promise<SyncRecord[]> {
    const query: { limit: number; fromId?: string } = { limit };
    if (fromId) {
      query.fromId = fromId;
    }
    return this.get(`sync/${sessionId}/pull`, query, {
      timeout: 5 * 60 * 1000,
    });
  }

  async push(sessionId: string, changes: any): Promise<void> {
    return this.post(`sync/${sessionId}/push`, { changes });
  }

  async completePush(sessionId: string, tablesToInclude: string[]): Promise<void> {
    // first off, mark the push as complete on central
    await this.post(`sync/${sessionId}/push/complete`, {
      tablesToInclude,
      deviceId: this.deviceId,
    });

    // now poll the complete check endpoint until we get a valid response - it takes a while for
    // the pushed changes to finish persisting to the central database
    await this.pollUntilOk(`sync/${sessionId}/push/complete`);
  }
}
