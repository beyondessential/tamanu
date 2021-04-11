import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import config from 'config';
import { chunk } from 'lodash';

import { BadAuthenticationError, InvalidOperationError, RemoteTimeoutError } from 'shared/errors';
import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';
import { getResponseJsonSafely } from 'shared/utils';
import { log } from 'shared/services/logging';

import { version } from '~/../package.json';

const API_VERSION = 'v1';
const DEFAULT_TIMEOUT = 10000;

const getVersionIncompatibleMessage = (error, response) => {
  if (error.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
    const minVersion = response.headers.get('X-Min-Client-Version');
    return `Please upgrade to Tamanu LAN Server v${minVersion} or higher.`;
  }

  if (error.message === VERSION_COMPATIBILITY_ERRORS.HIGH) {
    const maxVersion = response.headers.get('X-Max-Client-Version');
    return `The Tamanu Sync Server only supports up to v${maxVersion} of the LAN Server, and needs to be upgraded. Please contact your system administrator.`;
  }

  return null;
};

export class WebRemote {
  connectionPromise = null;

  // test mocks don't always apply properly - this ensures the mock will be used
  fetchImplementation = fetch;

  constructor() {
    this.host = config.sync.host;
    this.timeout = config.sync.timeout || DEFAULT_TIMEOUT;
  }

  async fetch(endpoint, params = {}) {
    const {
      headers = {},
      body,
      method = 'GET',
      retryAuth = true,
      awaitConnection = true,
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

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, this.timeout);
    let response;
    try {
      response = await this.fetchImplementation(url, {
        method,
        headers: {
          Accept: 'application/json',
          'X-Runtime': 'Tamanu LAN Server',
          'X-Version': version,
          Authorization: this.token ? `Bearer ${this.token}` : undefined,
          'Content-Type': body ? 'application/json' : undefined,
          ...headers,
        },
        body: body && JSON.stringify(body),
        ...otherParams,
        signal: controller.signal,
      });
    } catch (e) {
      // TODO: import AbortError from node-fetch once we're on v3.0
      if (e.name === 'AbortError') {
        throw new RemoteTimeoutError(`Server failed to respond within ${this.timeout}ms - ${url}`);
      }
      throw e;
    } finally {
      clearTimeout(timeoutHandle);
    }

    const checkForInvalidToken = ({ status }) => status === 401;
    if (checkForInvalidToken(response)) {
      if (retryAuth) {
        log.warn('Token was invalid - reconnecting to sync server');
        await this.connect();
        return this.fetch(endpoint, { ...params, retryAuth: false });
      }
      throw new BadAuthenticationError(`Invalid credentials`);
    }

    if (!response.ok) {
      const { error } = await getResponseJsonSafely(response);

      // handle version incompatibility
      if (response.status === 400 && error) {
        const versionIncompatibleMessage = getVersionIncompatibleMessage(error, response);
        if (versionIncompatibleMessage) throw new InvalidOperationError(versionIncompatibleMessage);
      }
      throw new InvalidOperationError(`Server responded with status code ${response.status}`);
    }

    return response.json();
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
        },
        awaitConnection: false,
        retryAuth: false,
      });

      if (!body.token || !body.user) {
        throw new BadAuthenticationError(`Encountered an unknown error while authenticating`);
      }

      log.info(`Received token for user ${body.user.displayName} (${body.user.email})`);
      this.token = body.token;
    })();

    // await connection attempt, throwing an error if applicable, but always removing connectionPromise
    try {
      await this.connectionPromise;
      return this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  async fetchChannelsWithChanges(channelsToCheck) {
    const body = channelsToCheck.reduce(
      (acc, { channel, cursor = '0' }) => ({
        ...acc,
        [channel]: cursor,
      }),
      {},
    );
    const { channelsWithChanges } = await this.fetch(`sync/channels`, { body });
    return channelsWithChanges;
  }

  async pull(channel, { since = 0, limit = 100, page = 0 } = {}) {
    const path = `sync/${encodeURIComponent(channel)}?since=${since}&limit=${limit}&page=${page}`;
    return this.fetch(path);
  }

  async push(channel, body) {
    const path = `sync/${encodeURIComponent(channel)}`;
    return this.fetch(path, { method: 'POST', body });
  }

  async whoami() {
    return this.fetch('whoami');
  }
}
