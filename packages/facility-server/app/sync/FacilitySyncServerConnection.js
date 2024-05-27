import config from 'config';

import { RemoteCallFailedError, RemoteTimeoutError } from '@tamanu/shared/errors';
import { getResponseJsonSafely } from '@tamanu/shared/utils';
import { log } from '@tamanu/shared/services/logging';
import { fetchWithTimeout } from '@tamanu/shared/utils/fetchWithTimeout';

/**
 * The sync triggering api is non-authed, and generally protected by making it
 * only accessible on localhost via the reverse proxy. This is ok because it doesn't
 * so anything sensitive or dangerous, but please keep it that way - only add new routes
 * or functionality with healthy caution, or after implementing auth
 */
export class FacilitySyncServerConnection {
  constructor() {
    this.host = `${config.sync.syncApiConnection.host.trim().replace(/\/*$/, '')}:${
      config.sync.syncApiConnection.port
    }`;
    this.timeout = config.sync.syncApiConnection.timeout;
  }

  async fetch(endpoint, params = {}) {
    const { body, method = 'GET', ...otherParams } = params;

    const url = `${this.host}/sync/${endpoint}`;
    log.debug(`[FacilitySyncServerConnection] ${method} ${url}`);

    try {
      const response = await fetchWithTimeout(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': body ? 'application/json' : undefined,
        },
        body: body && JSON.stringify(body),
        timeout: this.timeout,
        ...otherParams,
      });

      if (!response.ok) {
        const responseBody = await getResponseJsonSafely(response);
        const { error } = responseBody;

        const errorMessage = error ? error.message : 'no error message given';
        const err = new RemoteCallFailedError(
          `Sync API responded with status code ${response.status} (${errorMessage})`,
        );
        throw err;
      }

      return response.json();
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new RemoteTimeoutError(`Server failed to respond within ${this.timeout}ms - ${url}`);
      }
      throw e;
    }
  }

  async runSync(syncData) {
    return this.fetch('run', { method: 'POST', body: { syncData } });
  }

  async getSyncStatus() {
    return this.fetch('status', { method: 'GET' });
  }
}
