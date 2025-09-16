import config from 'config';

import { extractErrorFromFetchResponse } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

/**
 * The sync triggering api is non-authed, and generally protected by making it
 * only accessible on localhost via the reverse proxy. This is ok because it doesn't
 * do anything sensitive or dangerous, but please keep it that way - only add new routes
 * or functionality with healthy caution, or after implementing auth
 */
export class FacilitySyncConnection {
  constructor() {
    this.host = `${config.sync.syncApiConnection.host.trim().replace(/\/*$/, '')}:${
      config.sync.syncApiConnection.port
    }`;
  }

  async fetch(endpoint, params = {}) {
    const { body, method = 'GET' } = params;

    const url = `${this.host}/sync/${endpoint}`;
    log.debug(`[FacilitySyncConnection] ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': body ? 'application/json' : undefined,
      },
      body: body && JSON.stringify(body),
    });

    if (!response.ok) {
      throw await extractErrorFromFetchResponse(response, url, log);
    }

    return await response.json();
  }

  async runSync(syncData) {
    return await this.fetch('run', { method: 'POST', body: { syncData } });
  }

  async getSyncStatus() {
    return await this.fetch('status');
  }
}
