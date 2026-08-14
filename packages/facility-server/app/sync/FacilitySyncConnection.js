import config from 'config';

import { extractErrorFromFetchResponse, RemoteUnreachableError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
import { sleepAsync } from '@tamanu/utils/sleepAsync';

// Attempt delays are cumulative, so these back off over 3.5s and then give up. That stays inside
// the 10s the api route races a trigger against, so a request that can't get through reports the
// real error rather than being masked as "sync is taking a while".
const RETRY_DELAYS_MS = [500, 1000, 2000];

/** Describe why a fetch never got a response.
 *
 * `fetch` rejects with a bare `TypeError: fetch failed` and puts the real reason in `cause`,
 * which for a hostname resolving to several addresses (`localhost` being both `::1` and
 * `127.0.0.1`) is an AggregateError holding one error per address tried.
 */
function describeTransportFailure(error) {
  const cause = error.cause ?? error;
  if (cause instanceof AggregateError && cause.errors?.length) {
    return cause.errors.map(each => each.message).join('; ');
  }
  return cause.message || error.message;
}

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

  /** Make the request, retrying if the sync process can't be reached at all.
   *
   * The sync process runs separately to the api process and only starts listening once it has
   * checked migrations, opened its reporting stores and set up the sync runtime, so this hop
   * fails outright for a stretch after any restart while the api process is already serving the
   * web app. Retrying rides over the tail of that window, and over a connection dropped as the
   * sync process closes an idle socket.
   *
   * Retrying a trigger is safe: `FacilitySyncManager.triggerSync` collapses concurrent requests
   * into the running sync rather than starting a second one.
   *
   * There's deliberately no request timeout: `POST /sync/run` stays open for the whole sync,
   * which legitimately runs for minutes. A connect that hangs rather than being refused is
   * already bounded by undici's own connect timeout.
   */
  async #fetchOrThrowUnreachable(url, options) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fetch(url, options);
      } catch (error) {
        const reason = describeTransportFailure(error);
        const delay = RETRY_DELAYS_MS[attempt - 1];
        if (!delay) {
          throw new RemoteUnreachableError(
            `Could not reach the sync process at ${this.host} after ${attempt} attempts (${reason}). It may still be starting up, in which case sync resumes on its own once it is listening.`,
          ).withCause(error);
        }

        log.warn(`[FacilitySyncConnection] could not reach ${url}, retrying`, {
          attempt,
          maxAttempts: RETRY_DELAYS_MS.length + 1,
          reason,
        });
        await sleepAsync(delay);
      }
    }
  }

  async fetch(endpoint, params = {}) {
    const { body, method = 'GET' } = params;

    const url = `${this.host}/sync/${endpoint}`;
    log.debug(`[FacilitySyncConnection] ${method} ${url}`);

    const headers = { Accept: 'application/json' };
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await this.#fetchOrThrowUnreachable(url, {
      method,
      headers,
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
