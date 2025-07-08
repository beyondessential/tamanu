import config from 'config';

import {
  TamanuApi,
  AuthError,
  AuthInvalidError,
  VersionIncompatibleError,
} from '@tamanu/api-client';
import {
  BadAuthenticationError,
  FacilityAndSyncVersionIncompatibleError,
  RemoteCallFailedError,
} from '@tamanu/shared/errors';
import { SERVER_TYPES, SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { log } from '@tamanu/shared/services/logging';

import { version } from '../serverInfo';

export class CentralServerConnection extends TamanuApi {
  #loginData;

  constructor({ deviceId }) {
    const url = new URL(config.sync.host.trim());
    url.pathname = '/api';

    super({
      logger: log,
      endpoint: url.toString(),
      agentName: SERVER_TYPES.FACILITY,
      agentVersion: version,
      deviceId,
      defaultRequestConfig: {
        timeout: config.sync.timeout,
        waitForAuth: true,
        backoff: true,
      },
    });
  }

  async fetch(endpoint, options = {}, upOptions = null) {
    let retryAuth;
    let query;
    let config;
    if (!upOptions || options.query || options.retryAuth || options.method) {
      // this is a local style 2-arity call
      retryAuth = ['login', 'refresh'].includes(endpoint) ? false : (options.retryAuth ?? true);
      query = options.query ?? {};
      delete options.retryAuth;
      delete options.query;
      config = options;
    } else {
      // this is an api-client style 3-arity call
      retryAuth = upOptions.retryAuth ?? false;
      delete upOptions.retryAuth;
      query = options;
      config = upOptions;
    }

    if (retryAuth && !this.hasToken()) {
      await this.connect();
    }

    try {
      return await super.fetch(endpoint, query, config);
    } catch (error) {
      if (retryAuth && error instanceof AuthError) {
        await this.connect();
        return await super.fetch(endpoint, query, config);
      }

      throw error;
    }
  }

  async pollUntilTrue(endpoint) {
    return this.pollUntilOk(endpoint);
  }

  async connect(backoff = config.sync.backoff, timeout = this.timeout) {
    try {
      await this.refreshToken({
        retryAuth: false,
      });
      return;
    } catch (_) {
      // ignore error
    }

    const { email, password } = config.sync;
    log.info(`Logging in to ${this.host} as ${email}...`);

    try {
      return await this.login(email, password, {
        backoff,
        timeout,
      }).then(loginData => {
        return (this.#loginData = loginData);
      });
    } catch (error) {
      if (error instanceof AuthInvalidError) {
        const newError = new BadAuthenticationError(error.message);
        newError.response = error.response;
        newError.cause = error;
        throw newError;
      }

      if (error instanceof VersionIncompatibleError) {
        const newError = new FacilityAndSyncVersionIncompatibleError(error.message);
        newError.response = error.response;
        newError.cause = error;
        throw newError;
      }

      const newError = new RemoteCallFailedError(error.message);
      newError.response = error.response;
      newError.cause = error;
      throw newError;
    }
  }

  async loginData() {
    if (!this.hasToken() || !this.#loginData) {
      await this.connect();
    }

    return this.#loginData;
  }

  async startSyncSession({ urgent, lastSyncedTick }) {
    const facilityIds = selectFacilityIds(config);
    const { sessionId, status } = await this.fetch('sync', {
      method: 'POST',
      body: {
        facilityIds,
        deviceId: this.deviceId,
        urgent,
        lastSyncedTick,
      },
    });

    if (!sessionId) {
      // we're waiting in a queue
      return { status };
    }

    // then, wait until the sync session is ready
    // this is because POST /sync (especially the tickTockGlobalClock action) might get blocked
    // and take a while if the central server is concurrently persisting records from another client

    if (this.streaming) {
      for await (const { kind, data } of this.stream(() => ({
        endpoint: `sync/${sessionId}/ready/stream`,
      }))) {
        handler: switch (kind) {
          case SYNC_STREAM_MESSAGE_KIND.SESSION_WAITING:
            // still waiting
            break handler;
          case SYNC_STREAM_MESSAGE_KIND.END:
            // includes the new tick from starting the session
            return { sessionId, ...data };
          default:
            log.warn(`Unexpected message kind: ${kind}`);
        }
      }
      throw new Error('Unexpected end of stream');
    }

    await this.pollUntilTrue(`sync/${sessionId}/ready`);
    // when polling, we need to separately fetch the new tick from starting the session
    const { startedAtTick } = await this.fetch(`sync/${sessionId}/metadata`);
    return { sessionId, startedAtTick };
  }

  async endSyncSession(sessionId) {
    return this.fetch(`sync/${sessionId}`, { method: 'DELETE' });
  }

  async initiatePull(sessionId, since) {
    // first, set the pull filter on the central server,
    // which will kick off a snapshot of changes to pull
    const facilityIds = selectFacilityIds(config);
    const body = { since, facilityIds, deviceId: this.deviceId };
    await this.fetch(`sync/${sessionId}/pull/initiate`, { method: 'POST', body });

    // then, wait for the pull/ready endpoint until we get a valid response;
    // it takes a while for pull/initiate to finish populating the snapshot of changes

    if (this.streaming) {
      for await (const { kind, data } of this.stream(() => ({
        endpoint: `sync/${sessionId}/pull/ready/stream`,
      }))) {
        handler: switch (kind) {
          case SYNC_STREAM_MESSAGE_KIND.PULL_WAITING:
            // still waiting
            break handler;
          case SYNC_STREAM_MESSAGE_KIND.END:
            // includes the metadata for the changes we're about to pull
            return { sessionId, ...data };
          default:
            log.warn(`Unexpected message kind: ${kind}`);
        }
      }
      throw new Error('Unexpected end of stream');
    }

    await this.pollUntilTrue(`sync/${sessionId}/pull/ready`);
    // when polling, we need to separately fetch the metadata for the changes we're about to pull
    return this.fetch(`sync/${sessionId}/pull/metadata`);
  }

  async pull(sessionId, { limit = 100, fromId } = {}) {
    const query = { limit };
    if (fromId) {
      query.fromId = fromId;
    }
    return this.fetch(`sync/${sessionId}/pull`, { query });
  }

  async push(sessionId, changes) {
    const path = `sync/${sessionId}/push`;
    return this.fetch(path, { method: 'POST', body: { changes } });
  }

  async completePush(sessionId) {
    // first off, mark the push as complete on central
    await this.fetch(`sync/${sessionId}/push/complete`, {
      method: 'POST',
      body: { deviceId: this.deviceId },
    });

    // now poll the complete check endpoint until we get a valid response - it takes a while for
    // the pushed changes to finish persisting to the central database
    await this.pollUntilTrue(`sync/${sessionId}/push/complete`);
  }

  async whoami() {
    return this.fetch('whoami');
  }

  async forwardRequest(req, endpoint) {
    return this.fetch(endpoint, {
      method: req.method,
      body: req.body,
    });
  }
}
