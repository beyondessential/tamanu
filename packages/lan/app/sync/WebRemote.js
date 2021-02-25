import fetch from 'node-fetch';
import config from 'config';

import { BadAuthenticationError, InvalidOperationError } from 'shared/errors';

import { version } from '~/../package.json';
import { log } from '~/logging';

const API_VERSION = 'v1';

export class WebRemote {
  connectionPromise = null;

  constructor() {
    this.host = config.sync.host;
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

    // if there's an ongoing connection attempt, wait until it's finished,
    // unless we're deliberately progressing without it
    if (awaitConnection) {
      try {
        await this.connectionPromise;
      } catch (e) {
        // ignore
      }
    }

    const url = `${this.host}/${API_VERSION}/${endpoint}`;
    log.info(`[sync] ${method} ${url}`);

    const response = await fetch(url, {
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
    });

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

    return response;
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

      const response = await this.fetch('login', {
        method: 'POST',
        body: {
          email,
          password,
        },
        awaitConnection: false,
        retryAuth: false,
      });

      const data = await response.json();

      if (!data.token || !data.user) {
        throw new BadAuthenticationError(`Encountered an unknown error while authenticating`);
      }

      log.info(`Received token for user ${data.user.displayName} (${data.user.email})`);
      this.token = data.token;
    })();

    // await connection attempt, throwing an error if applicable, but always removing connectionPromise
    try {
      await this.connectionPromise;
      return this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  async receive(channel, { since = 0, limit = 100 } = {}) {
    const path = `sync/${encodeURIComponent(channel)}?since=${since}&limit=${limit}`;
    const response = await this.fetch(path);
    const body = await response.json();
    return body.records;
  }

  async send() {
    throw new Error('WebRemote: send is not implemented yet');
  }

  async whoami() {
    const response = await this.fetch('whoami');
    return response.json();
  }
}
