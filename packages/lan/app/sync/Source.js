import fetch from 'node-fetch';

import { BadAuthenticationError, InvalidOperationError } from 'shared/errors';

import { version } from '~/../package.json';
import { log } from '~/logging';

const API_VERSION = 'v1';

export class Source {
  context = null;

  constructor(context) {
    this.context = context;
  }

  async fetch(endpoint, params = {}) {
    const { headers = {}, body, method = 'GET', ...otherParams } = params;

    const url = `${this.host}/${API_VERSION}/${endpoint}`;
    log.info(`[sync] ${method} ${url}`);

    const response = fetch(url, {
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

    if (this.token) {
      const checkForInvalidToken = ({ status }) => status === 401;
      if (checkForInvalidToken(response)) {
        log.warning('Token was invalid - disconnecting from sync server');
        this.token = '';
      }
    }

    return response;
  }

  async connectToRemote(params) {
    const { email, password, host } = params;

    log.info(`Logging in to ${host} as ${email}...`);

    this.host = host;

    const response = await this.fetch('login', {
      method: 'POST',
      body: {
        email,
        password,
      },
    });

    if (response.status === 401) {
      throw new BadAuthenticationError(`Invalid credentials`);
    } else if (!response.ok) {
      throw new InvalidOperationError(`Server responded with status code ${response.statusCode}`);
    }

    const data = await response.json();

    if (!data.token || !data.user) {
      throw new BadAuthenticationError(`Encountered an unknown error while authenticating`);
    }

    log.info(`Received token for user ${data.user.displayName} (${data.user.email})`);
    this.token = data.token;
  }

  async downloadRecords() {
    throw new Error('Source: downloadRecords is not implemented yet');    
  }

  async uploadRecords() {
    throw new Error('Source: uploadRecords is not implemented yet');
  }
}
