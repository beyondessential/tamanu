import fetch, { AbortError } from 'node-fetch';
import AbortController from 'abort-controller';
import config from 'config';

import { BadAuthenticationError, InvalidOperationError, RemoteTimeoutError } from 'shared/errors';

import { version } from '~/../package.json';
import { log } from '~/logging';

const API_VERSION = 'v1';
const DEFAULT_TIMEOUT = 10000;

export class WebRemote {
  connectionPromise = null;

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
      response = await fetch(url, {
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
