import config from 'config';

import { RemoteCallFailedError, RemoteTimeoutError } from '@tamanu/shared/errors';
import { getResponseJsonSafely } from '@tamanu/shared/utils';
import { log } from '@tamanu/shared/services/logging';
import { fetchWithTimeout } from '@tamanu/shared/utils/fetchWithTimeout';

import { callWithBackoff } from './callWithBackoff';

/**
 * The sync triggering api is non-authed, and generally protected by making it
 * only accessible on localhost via the reverse proxy. This is ok because it doesn't
 * so anything sensitive or dangerous, but please keep it that way - only add new routes
 * or functionality with healthy caution, or after implementing auth
 */
export class FacilitySyncServerConnection {
  connectionPromise = null;

  constructor() {
    this.host = `${config.sync.server.trim().replace(/\/*$/, '')}:${config.sync.port}`;
    this.timeout = config.sync.timeout;
  }

  async fetch(endpoint, params = {}) {
    const { body, method = 'GET', awaitConnection = true, backoff, ...otherParams } = params;

    // if there's an ongoing connection attempt, wait until it's finished
    // if we don't have a token, connect
    // allows deliberately skipping connect (so connect doesn't call itself)
    if (awaitConnection) {
      try {
        if (!this.token) {
          // Deliberately use same backoff policy to avoid retrying in some places
          await this.connect(backoff, otherParams.timeout);
        } else {
          await this.connectionPromise;
        }
      } catch (e) {
        // ignore
      }
    }

    const url = `${this.host}/api/${endpoint}`;
    log.debug(`[sync] ${method} ${url}`);

    return callWithBackoff(async () => {
      if (config.debugging.requestFailureRate) {
        if (Math.random() < config.debugging.requestFailureRate) {
          // intended to cause some % of requests to fail, to simulate a flaky connection
          throw new Error('Chaos: made your request fail');
        }
      }
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
            `Server responded with status code ${response.status} (${errorMessage})`,
          );
          throw err;
        }

        return await response.json();
      } catch (e) {
        if (e.name === 'AbortError') {
          throw new RemoteTimeoutError(
            `Server failed to respond within ${this.timeout}ms - ${url}`,
          );
        }
        throw e;
      }
    }, backoff);
  }

  async runSync(syncData) {
    return this.fetch('sync/run', { method: 'POST', body: { syncData } });
  }

  async getSyncStatus() {
    return this.fetch('sync/status', { method: 'GET' });
  }
}
