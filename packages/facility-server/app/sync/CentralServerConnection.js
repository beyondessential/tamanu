import config from 'config';

import { TamanuApi } from '@tamanu/api-client';
import { SERVER_TYPES, SYNC_STREAM_MESSAGE_KIND, DEVICE_SCOPES } from '@tamanu/constants';

import { ERROR_TYPE } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

import { version } from '../serverInfo';
import { getSyncConfig, getServerFacilityIds } from '../serverConfig';
import { faithFetch } from './faithFetch';

// Retry-After is a whole number of seconds (or an HTTP date, which central does not send). Anything
// else, or nothing, waits the default. Always at least a second, so a zero cannot spin.
function parseRetryAfterSeconds(header, { defaultRetryAfterSeconds, maxRetryAfterSeconds }) {
  const trimmed = header?.trim() ?? '';
  const seconds = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : defaultRetryAfterSeconds;
  return Math.min(Math.max(seconds, 1), maxRetryAfterSeconds);
}

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
      await this.connect();
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

  // spec: SYNCHK#while-central-wakes
  // A sleeping central answers requests that need its database with 503 and a Retry-After while
  // it wakes. That is not a failure: wait as long as it says and ask again, for as long as it keeps
  // answering that way, up to `sync.centralWake.maxTotalWaitSeconds` in all so that a wake that
  // never finishes eventually fails the attempt with the last 503.
  async #fetchWhileCentralWakes(endpoint, options) {
    const { defaultRetryAfterSeconds, maxRetryAfterSeconds, maxTotalWaitSeconds } =
      config.sync.centralWake;
    let waitedSeconds = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // fetch() consumes some of its options, so each attempt gets its own copy
        return await this.fetch(endpoint, { ...options });
      } catch (error) {
        if (error.response?.status !== 503) throw error;

        const retryAfterSeconds = parseRetryAfterSeconds(
          error.response.headers?.get('retry-after'),
          { defaultRetryAfterSeconds, maxRetryAfterSeconds },
        );
        if (waitedSeconds + retryAfterSeconds > maxTotalWaitSeconds) {
          log.warn('CentralServerConnection.centralWakeTimedOut', { endpoint, waitedSeconds });
          throw error;
        }

        log.info('CentralServerConnection.centralWaking', {
          endpoint,
          retryAfterSeconds,
          waitedSeconds,
        });
        await sleepAsync(retryAfterSeconds * 1000);
        waitedSeconds += retryAfterSeconds;
      }
    }
  }

  // spec: SYNCHK#the-check
  // Asks central whether anything that syncs has changed since the tick our last pull reached.
  // Leave `since` undefined when we have never pulled.
  async checkChangesPending(since) {
    const query = since === undefined ? {} : { since };
    const { changesToPull } = await this.#fetchWhileCentralWakes('sync/pending', { query });
    if (typeof changesToPull !== 'boolean') {
      throw new Error('Central answered the changes-pending check without a changesToPull flag');
    }
    return changesToPull;
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
