import config from 'config';
import fetch from 'node-fetch';

import { log } from '~/logging';
import { version } from '~/../package.json';

class AuthenticationError extends Error {}
class InvalidCredentialsError extends Error {}

const checkForInvalidToken = (response) => false;

export class SyncManager {

  host = '';
  apiVersion = 'v1';
  token = '';

  context = null;

  constructor(context) {
    this.context = context;
  }

  async fetch(endpoint, params = {}) {
    const {
      headers = {},
      body,
      method = 'GET',
      ...otherParams
    } = params;

    const url = `${this.host}/${this.apiVersion}/${endpoint}`;
    log.info(`[sync] ${method} ${url}`);
    
    const response = fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'X-Runtime': 'Tamanu LAN Server',
        'X-Version': version,
        'Authorization': this.token ? `Bearer ${this.token}` : undefined,
        'Content-Type': body ? 'application/json' : undefined,
        ...headers,
      },
      body: body && JSON.stringify(body),
      ...otherParams,
    });

    if (checkForInvalidToken(response)) {
      this.token = '';
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

    if (response.status >= 500) {
      throw new AuthenticationError(`Server responded with status code ${response.statusCode}`);
    } else if (response.status == 401) {
      throw new InvalidCredentialsError(`Invalid credentials`);
    }

    const data = await response.json();

    if(!data.token || !data.user) {
      throw new AuthenticationError(`Encountered an unknown error while authenticating`); 
    }

    log.info(`Received token for user ${data.user.displayName} (${data.user.email})`);
    this.token = data.token;
  }
  
  async runSync() {
    if(!this.token) {
      await this.connectToRemote(config.sync);
    }

    // TODO: sync functionality
    const response = await this.fetch('whoami');
    const data = await response.json();
    log.info(`Sync test - logged in as ${data.displayName}`);
  }
}
