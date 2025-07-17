import mitt from 'mitt';
import { readConfig } from '../config';
import { version } from '/root/package.json';

import {
  BadAuthenticationError,
  FacilityAndSyncVersionIncompatibleError,
  RemoteCallFailedError,
} from '@tamanu/shared';
import {
  TamanuApi,
  AuthError,
  AuthInvalidError,
  VersionIncompatibleError,
  LoginResponse,
} from '@tamanu/api-client';
import { SERVER_TYPES, SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';
import { CAN_ACCESS_ALL_FACILITIES } from '@tamanu/constants/auth';

import { CentralConnectionStatus, FetchOptions, SyncRecord, SyncConnectionParameters } from '~/types';

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

  async connect(
    params: SyncConnectionParameters = {},
    backoff = { maxAttempts: 1 },
    timeout = 10000,
  ) {
    try {
      await super.refreshToken({
        // retryAuth: false, Doesn't exist on TamanuApi side
      });
      return;
    } catch (_) {
      // ignore error
    }

    const facilityId = await readConfig('facilityId', '');

    try {
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

  async streaming() {
    return Boolean((await this.loginData())?.settings?.sync?.streaming?.enabled);
  }

  async startSyncSession({ urgent, lastSyncedTick }) {
    const facilityId = await readConfig('facilityId', '');

    // start a sync session (or refresh our position in the queue)
    const { sessionId, status } = await this.fetch(
      'sync',
      {},
      {
        method: 'POST',
        body: {
          urgent,
          lastSyncedTick,
          facilityIds: [facilityId],
          deviceId: this.deviceId,
          isMobile: true,
        },
      },
    );

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
            console.warn(`Unexpected message kind: ${kind}`);
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
    await this.fetch(`sync/${sessionId}/pull/initiate`, {}, { method: 'POST', body });

    if (await this.streaming()) {
      for await (const { kind, message } of this.stream(() => ({
        endpoint: `sync/${sessionId}/pull/ready/stream`,
      }))) {
        handler: switch (kind) {
          case SYNC_STREAM_MESSAGE_KIND.PULL_WAITING:
            // still waiting
            break handler;
          case SYNC_STREAM_MESSAGE_KIND.END:
            // includes the metadata for the changes we're about to pull
            return { sessionId, ...message };
          default:
            console.warn(`Unexpected message kind: ${kind}`);
        }
      }
      throw new Error('Unexpected end of stream');
    }

    // poll the pull/ready endpoint until we get a valid response - it takes a while for
    // pull/initiate to finish populating the snapshot of changes
    await this.pollUntilOk(`sync/${sessionId}/pull/ready`);

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
    return this.fetch(`sync/${sessionId}/pull`, query, {
      // allow 5 minutes for the sync pull as it can take a while
      // (the full 5 minutes would be pretty unusual! but just to be safe)
      timeout: 5 * 60 * 1000,
    });
  }

  async push(sessionId: string, changes: any): Promise<void> {
    return this.fetch(`sync/${sessionId}/push`, {}, { method: 'POST', body: { changes } });
  }

  async completePush(sessionId: string, tablesToInclude: string[]): Promise<void> {
    // first off, mark the push as complete on central
    await this.fetch(
      `sync/${sessionId}/push/complete`,
      {},
      {
        method: 'POST',
        body: { tablesToInclude, deviceId: this.deviceId },
      },
    );

    // now poll the complete check endpoint until we get a valid response - it takes a while for
    // the pushed changes to finish persisting to the central database
    await this.pollUntilOk(`sync/${sessionId}/push/complete`);
  }
}
