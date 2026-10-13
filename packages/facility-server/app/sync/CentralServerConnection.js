import config from 'config';

import { TamanuApi } from '@tamanu/api-client';
import { SERVER_TYPES, SYNC_STREAM_MESSAGE_KIND, DEVICE_SCOPES } from '@tamanu/constants';

import { ERROR_TYPE } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

import { version } from '../serverInfo';
import { getSyncConfig, getServerFacilityIds } from '../serverConfig';
import { faithFetch } from './faithFetch';
import { getCentralEndpointSelector, getCurrentCentralHost } from './CentralEndpointSelector';

// spec: CEND
const apiEndpointOf = host => {
  const url = new URL(host);
  url.pathname = '/api';
  return url.toString();
};

// The endpoint stopped working: nothing answered, or a proxy in front of central did not get an
// answer from it. Other errors come from central itself and say nothing about the endpoint.
const isEndpointFailure = error =>
  error?.type === ERROR_TYPE.REMOTE_UNREACHABLE || [502, 503, 504].includes(error?.status);

// With somewhere else to go, a call that finds its endpoint dead should say so within seconds
// rather than after the full backoff, which is kept for the retry on the endpoint chosen.
const FAILOVER_BACKOFF = { maxAttempts: 3, maxWaitMs: 2000 };

export class CentralServerConnection extends TamanuApi {
  #loginData;
  #hostInUse;

  constructor({ deviceId }) {
    const host = getCurrentCentralHost();
    if (!host) {
      throw new Error('Facility server has no sync host configured');
    }

    super({
      logger: log,
      endpoint: apiEndpointOf(host),
      agentName: SERVER_TYPES.FACILITY,
      agentVersion: version,
      deviceId,
      defaultRequestConfig: {
        timeout: config.sync.timeout,
        waitForAuth: true,
        backoff: true,
      },
    });

    this.#hostInUse = host;

    if (process.env.TAMANU_DISABLE_FAITH_FETCH !== 'true') {
      this.fetchImplementation = faithFetch;
    }
  }

  // Follows the endpoint the selector has chosen, which can change between calls. Credentials are
  // for the old endpoint, so the next call logs in again. A sync session in progress stays on the
  // endpoint it started on. Returns whether it moved.
  #followSelectedEndpoint() {
    const selector = getCentralEndpointSelector();
    if (!selector || selector.isSessionActive()) return false;
    const host = selector.current();
    if (!host || host === this.#hostInUse) return false;

    log.info('CentralServerConnection: switching central endpoint', {
      from: this.#hostInUse,
      to: host,
    });
    this.setEndpoint(apiEndpointOf(host));
    this.#hostInUse = host;
    this.#loginData = null;
    return true;
  }

  // The endpoint failed. When this connection may fail over, has the selector look for another
  // endpoint and resolves true once it has moved there, so the caller retries. A running session
  // instead fails with its error, and the next call outside it does the looking.
  async #failOver(error) {
    const selector = getCentralEndpointSelector();
    if (!selector?.canFailOver() || !isEndpointFailure(error)) return false;

    await selector.walk({ reason: error.message });
    return this.#followSelectedEndpoint();
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

    const isAuthEndpoint = ['login', 'refresh'].includes(endpoint);
    if (isAuthEndpoint) {
      retryAuth = false;
    }

    this.#followSelectedEndpoint();
    // a running session keeps its full backoff, so a brief outage does not cost it the session
    const canFailFast =
      !isAuthEndpoint &&
      getCentralEndpointSelector()?.canFailOver() &&
      [undefined, true].includes(config.backoff);
    const firstConfig = canFailFast ? { ...config, backoff: FAILOVER_BACKOFF } : config;
    try {
      return await this.#fetchOnce(endpoint, { retryAuth, query, config: firstConfig, options });
    } catch (error) {
      // connect() has its own failover for logins, which are what reach the endpoint first
      if (isAuthEndpoint || !(await this.#failOver(error))) throw error;
      return await this.#fetchOnce(endpoint, { retryAuth, query, config, options });
    }
  }

  async #fetchOnce(endpoint, { retryAuth, query, config, options }) {
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
    this.#followSelectedEndpoint();
    try {
      await this.refreshToken({
        retryAuth: false,
      });
      return;
    } catch (_) {
      // ignore error
    }

    const selector = getCentralEndpointSelector();
    if (!selector?.canFailOver()) {
      return await this.#login(backoff, timeout);
    }

    // With alternatives, a failed login is not worth the full backoff on this endpoint: look for
    // another one first. A lockout is the exception, since more logins only extend it.
    try {
      return await this.#login(false, timeout);
    } catch (error) {
      if (error.type === ERROR_TYPE.RATE_LIMITED) throw error;
      await selector.walk({ reason: error.message });
      this.#followSelectedEndpoint();
      // when no endpoint passed this is still the original one, retried under the full backoff
      return await this.#login(backoff, timeout);
    }
  }

  async #login(backoff, timeout) {
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

  async startSyncSession({ urgent, lastSyncedTick }) {
    const connection = this;
    const facilityIds = getServerFacilityIds();
    const { sessionId, status } = await this.fetch('sync', {
      method: 'POST',
      body: {
        facilityIds,
        deviceId: this.deviceId,
        urgent,
        lastSyncedTick,
        // Central cannot reliably tell which name we used, as a proxy can hide it. Read when the
        // body is serialised, so it names the endpoint the request goes to even when a failover
        // switches endpoints partway through the call.
        get endpoint() {
          return connection.#hostInUse;
        },
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
