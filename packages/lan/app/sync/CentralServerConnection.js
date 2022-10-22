import fetch from 'node-fetch';
import config from 'config';

import {
  BadAuthenticationError,
  FacilityAndSyncVersionIncompatibleError,
  RemoteTimeoutError,
  RemoteCallFailedError,
} from 'shared/errors';
import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';
import { getResponseJsonSafely } from 'shared/utils';
import { log } from 'shared/services/logging';
import { fetchWithTimeout } from 'shared/utils/fetchWithTimeout';
import { sleepAsync } from 'shared/utils/sleepAsync';

import { version } from '../serverInfo';
import { callWithBackoff } from './callWithBackoff';

const API_VERSION = 'v1';

const getVersionIncompatibleMessage = (error, response) => {
  if (error.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
    const minVersion = response.headers.get('X-Min-Client-Version');
    return `Please upgrade to Tamanu Facility Server v${minVersion} or higher.`;
  }

  if (error.message === VERSION_COMPATIBILITY_ERRORS.HIGH) {
    const maxVersion = response.headers.get('X-Max-Client-Version');
    return `The Tamanu Sync Server only supports up to v${maxVersion} of the Facility Server, and needs to be upgraded. Please contact your system administrator.`;
  }

  return null;
};

const objectToQueryString = obj =>
  Object.entries(obj)
    .filter(([k, v]) => k !== undefined && v !== undefined)
    .map(kv => kv.map(str => encodeURIComponent(str)).join('='))
    .join('&');

export class CentralServerConnection {
  connectionPromise = null;

  // test mocks don't always apply properly - this ensures the mock will be used
  fetchImplementation = fetch;

  constructor() {
    this.host = config.sync.host.trim().replace(/\/*$/, '');
    this.timeout = config.sync.timeout;
    this.batchSize = config.sync.channelBatchSize;
  }

  async fetch(endpoint, params = {}) {
    const {
      headers = {},
      body,
      method = 'GET',
      retryAuth = true,
      awaitConnection = true,
      backoff,
      ...otherParams
    } = params;

    // if there's an ongoing connection attempt, wait until it's finished
    // if we don't have a token, connect
    // allows deliberately skipping connect (so connect doesn't call itself)
    if (awaitConnection) {
      try {
        if (!this.token) {
          await this.connect();
        } else {
          await this.connectionPromise;
        }
      } catch (e) {
        // ignore
      }
    }

    const url = `${this.host}/${API_VERSION}/${endpoint}`;
    log.debug(`[sync] ${method} ${url}`);

    return callWithBackoff(async () => {
      if (config.debugging.requestFailureRate) {
        if (Math.random() < config.debugging.requestFailureRate) {
          // intended to cause some % of requests to fail, to simulate a flaky connection
          throw new Error('Chaos: made your request fail');
        }
      }
      try {
        const response = await fetchWithTimeout(
          url,
          {
            method,
            headers: {
              Accept: 'application/json',
              'X-Tamanu-Client': 'Tamanu LAN Server',
              'X-Version': version,
              Authorization: this.token ? `Bearer ${this.token}` : undefined,
              'Content-Type': body ? 'application/json' : undefined,
              ...headers,
            },
            body: body && JSON.stringify(body),
            timeout: this.timeout,
            ...otherParams,
          },
          this.fetchImplementation,
        );
        const isInvalidToken = response?.status === 401;
        if (isInvalidToken) {
          if (retryAuth) {
            log.warn('Token was invalid - reconnecting to sync server');
            await this.connect();
            return this.fetch(endpoint, { ...params, retryAuth: false });
          }
          throw new BadAuthenticationError(`Invalid credentials`);
        }

        if (!response.ok) {
          const responseBody = await getResponseJsonSafely(response);
          const { error } = responseBody;

          // handle version incompatibility
          if (response.status === 400 && error) {
            const versionIncompatibleMessage = getVersionIncompatibleMessage(error, response);
            if (versionIncompatibleMessage) {
              throw new FacilityAndSyncVersionIncompatibleError(versionIncompatibleMessage);
            }
          }

          const errorMessage = error ? error.message : 'no error message given';
          const err = new RemoteCallFailedError(
            `Server responded with status code ${response.status} (${errorMessage})`,
          );
          // attach status and body from response
          err.centralServerResponse = {
            status: response.status,
            body: responseBody,
          };
          throw err;
        }

        return await response.json();
      } catch (e) {
        // TODO: import AbortError from node-fetch once we're on v3.0
        if (e.name === 'AbortError') {
          throw new RemoteTimeoutError(
            `Server failed to respond within ${this.timeout}ms - ${url}`,
          );
        }
        throw e;
      }
    }, backoff);
  }

  async connect() {
    // if there's an ongoing connect attempt, reuse it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // store a promise for other functions to await
    this.connectionPromise = (async () => {
      const { email, password } = config.sync;

      log.info(`Logging in to ${this.host} as ${email}...`);

      const body = await this.fetch('login', {
        method: 'POST',
        body: {
          email,
          password,
          facilityId: config.serverFacilityId,
        },
        awaitConnection: false,
        retryAuth: false,
      });

      if (!body.token || !body.user) {
        throw new BadAuthenticationError(`Encountered an unknown error while authenticating`);
      }

      log.info(`Received token for user ${body.user.displayName} (${body.user.email})`);
      this.token = body.token;

      return body;
    })();

    // await connection attempt, throwing an error if applicable, but always removing connectionPromise
    try {
      await this.connectionPromise;
      return this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  async startSyncSession() {
    return this.fetch('sync', { method: 'POST' });
  }

  async endSyncSession(sessionId) {
    return this.fetch(`sync/${sessionId}`, { method: 'DELETE' });
  }

  async tickGlobalClock() {
    return this.fetch(`sync/tick`, { method: 'POST' });
  }

  async setPullFilter(sessionId, since) {
    const body = { since, facilityId: config.serverFacilityId };
    return this.fetch(`sync/${sessionId}/pullFilter`, { method: 'POST', body });
  }

  async fetchPullCount(sessionId) {
    // poll the pull count endpoint until we get a valid response - it takes a while for
    // setPullFilter to finish populating the snapshot of changes
    const waitTime = 1000; // retry once per second
    const maxAttempts = 1200; // for a maximum of twenty minutes
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const count = await this.fetch(`sync/${sessionId}/pull/count`);
      if (count !== null) {
        return count;
      }
      await sleepAsync(waitTime);
    }
    throw new Error(`Could not fetch a valid pull count after ${maxAttempts} attempts`);
  }

  async pull(sessionId, { limit = 100, fromId } = {}) {
    const query = { limit };
    if (fromId) {
      query.fromId = fromId;
    }
    const path = `sync/${sessionId}/pull?${objectToQueryString(query)}`;
    return this.fetch(path);
  }

  async push(sessionId, body, { pushedSoFar, totalToPush }) {
    const path = `sync/${sessionId}/push?${objectToQueryString({
      pushedSoFar,
      totalToPush,
    })}`;
    return this.fetch(path, { method: 'POST', body });
  }

  async whoami() {
    return this.fetch('whoami');
  }

  async forwardRequest(req, endpoint) {
    try {
      const response = await this.fetch(endpoint, {
        method: req.method,
        body: req.body,
      });

      return response;
    } catch (err) {
      if (err.centralServerResponse) {
        // pass sync server response back
        const centralServerErrorMsg = err.centralServerResponse.body.error?.message;
        const passThroughError = new Error(centralServerErrorMsg ?? err);
        passThroughError.status = err.centralServerResponse.status;
        throw passThroughError;
      } else {
        // fallback
        throw new Error(`Sync server error: ${err}`);
      }
    }
  }
}
