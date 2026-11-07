import config from 'config';

import { TamanuApi } from '@tamanu/api-client';
import { SERVER_TYPES, SYNC_STREAM_MESSAGE_KIND, DEVICE_SCOPES } from '@tamanu/constants';

import { ERROR_TYPE } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

import { version } from '../serverInfo';
import { getSyncConfig, getServerFacilityIds } from '../serverConfig';
import { faithFetch } from './faithFetch';

export class CentralServerConnection extends TamanuApi {
  #loginData;

  constructor({ deviceId }) {
    const { host } = getSyncConfig();
    if (!host) {
      throw new Error('Facility server has no sync host configured');
    }
    const url = new URL(host);
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
      // spec: SYNCHK#while-central-wakes
      wakeRetry: config.sync.centralWake,
    });

    if (process.env.TAMANU_DISABLE_FAITH_FETCH !== 'true') {
      this.fetchImplementation = faithFetch;
    }
  }

  async fetch(endpoint, options = {}, upOptions = null) {
    let retryAuth;
    let query;
    let config;
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
      await this.connect(options.preserveBackoffForAuthAttempt ? options.backoff : undefined);
    }

    try {
      return await super.fetch(endpoint, query, config);
    } catch (error) {
      if (retryAuth && error.type?.startsWith(ERROR_TYPE.AUTH)) {
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

    const { email, password } = getSyncConfig();
    log.info(`Logging in to ${this.host} as ${email}...`);

    return await this.login(email, password, {
      backoff,
      timeout,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    }).then(loginData => {
      return (this.#loginData = loginData);
    });
  }

  async loginData() {
    if (!this.hasToken() || !this.#loginData) {
      // A login of our own, rather than one a request makes for itself inside fetch(), so it
      // needs the waking wrapper here: a sync that logs in before it asks central anything would
      // otherwise fail on the 503 a waking central answers with.
      await this.whileServerWakes('login', () => this.connect());
    }

    return this.#loginData;
  }

  async streaming() {
    return Boolean((await this.loginData())?.settings?.sync?.streaming?.enabled);
  }

  // spec: FBOOT#when-a-facility-bootstraps
  async fetchBootstrap() {
    const { records } = await this.fetch('sync/bootstrap', {
      method: 'POST',
      body: { facilityIds: getServerFacilityIds() },
    });
    return records;
  }

  // fetch() consumes some of its options, so each attempt gets its own copy
  async #fetchWhileCentralWakes(endpoint, options) {
    return this.whileServerWakes(endpoint, () => this.fetch(endpoint, { ...options }));
  }

  // spec: SYNCHK#the-check
  // Asks central whether anything that syncs has changed since the tick our last pull reached.
  // Leave `since` undefined when we have never pulled.
  async checkChangesPending(since) {
    const query = since === undefined ? {} : { since };

    let answer;
    try {
      answer = await this.#fetchWhileCentralWakes('sync/pending', { query });
    } catch (error) {
      // A central that does not have the check yet, because this facility was upgraded first,
      // answers 404. The check only ever saves a session that would have found nothing, so open
      // one rather than failing every scheduled sync until central catches up.
      if (error.response?.status !== 404) throw error;
      log.info('CentralServerConnection.changesPendingNotSupported');
      return true;
    }

    // anything but a clear "nothing" opens a session, which is always safe
    if (typeof answer?.changesToPull !== 'boolean') {
      log.warn('CentralServerConnection.changesPendingUnreadable');
      return true;
    }
    return answer.changesToPull;
  }

  async startSyncSession({ urgent, lastSyncedTick }) {
    const facilityIds = getServerFacilityIds();
    const { sessionId, status } = await this.#fetchWhileCentralWakes('sync', {
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

    await this.pollUntilTrue(`sync/${sessionId}/ready`);
    // when polling, we need to separately fetch the new tick from starting the session
    const { startedAtTick } = await this.fetch(`sync/${sessionId}/metadata`);
    return { sessionId, startedAtTick };
  }

  async markSessionErrored(sessionId, error) {
    return this.fetch(`sync/${sessionId}/error`, { method: 'POST', body: { error } });
  }

  async endSyncSession(sessionId) {
    return this.fetch(`sync/${sessionId}`, { method: 'DELETE' });
  }

  async initiatePull(sessionId, since) {
    // first, set the pull filter on the central server,
    // which will kick off a snapshot of changes to pull
    const facilityIds = getServerFacilityIds();
    const body = { since, facilityIds, deviceId: this.deviceId };
    await this.fetch(`sync/${sessionId}/pull/initiate`, { method: 'POST', body });

    // then, wait for the pull/ready endpoint until we get a valid response;
    // it takes a while for pull/initiate to finish populating the snapshot of changes

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
