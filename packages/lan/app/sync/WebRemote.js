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

  async receive(channel, { since = 0, limit = 100 } = {}) {
    const path = `sync/${encodeURIComponent(channel)}?since=${since}&limit=${limit}`;
    return (await this.fetch(path)).records;
  }

  async send() {
    throw new Error('WebRemote: send is not implemented yet');
  }

  async whoami() {
    return this.fetch('whoami');
  }
}
