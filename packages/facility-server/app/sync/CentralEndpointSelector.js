import { EventEmitter } from 'node:events';

import { TamanuApi } from '@tamanu/api-client';
import { DEVICE_SCOPES, FACT_CENTRAL_ENDPOINT_IN_USE, SERVER_TYPES } from '@tamanu/constants';
import { ERROR_TYPE } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

import { version } from '../serverInfo';
import { getSyncConfig } from '../serverConfig';
import { faithFetch } from './faithFetch';
import { getSyncLoginBackoff, isLoginRefusal } from './SyncLoginBackoff';

// spec: CEND
// Holds the ordered list of central hosts a facility server tries and the one it is using.
//
// The sync process owns the choice: it walks the list when the endpoint in use stops working and
// periodically rechecks earlier endpoints. Other processes (the API process) only follow what the
// sync process publishes through FACT_CENTRAL_ENDPOINT_IN_USE and never probe. A host is only ever
// chosen after a login at it succeeds.
// How long what a host's login said about which central it reaches is trusted. A name can start
// pointing at another server, so it is not remembered for good.
const IDENTITY_TTL_MS = 60 * 60_000;

export class CentralEndpointSelector extends EventEmitter {
  #models;
  #hosts;
  #current;
  #getProbeSettings;
  #createProbeClient;
  #canProbe;
  #now;
  #identities = new Map();
  #walking = null;
  #activeSessions = 0;

  /**
   * @param {object} args
   * @param {import('@tamanu/database/models')} args.models
   * @param {string[]} args.hosts ordered, highest priority first
   * @param {string | null} [args.inUse] the host in use, when known; defaults to the first
   * @param {() => string} args.getDeviceId
   * @param {() => Promise<{ recheckIntervalMs: number, probeTimeoutMs: number }>} args.getProbeSettings
   * @param {boolean} [args.canProbe] false for a process that only follows the sync process
   * @param {() => number} [args.now] the clock, for how long a host's identity is trusted
   * @param {(args: { host: string, timeoutMs: number }) => { login: Function }} [args.createProbeClient]
   */
  constructor({
    models,
    hosts,
    inUse = null,
    getDeviceId,
    getProbeSettings,
    canProbe = true,
    now = Date.now,
    createProbeClient = createDefaultProbeClient(getDeviceId),
  }) {
    super();
    this.#models = models;
    this.#hosts = [...hosts];
    this.#current = inUse && hosts.includes(inUse) ? inUse : (hosts[0] ?? null);
    this.#getProbeSettings = getProbeSettings;
    this.#createProbeClient = createProbeClient;
    this.#canProbe = canProbe;
    this.#now = now;
  }

  get hosts() {
    return [...this.#hosts];
  }

  /** The host in use. */
  current() {
    return this.#current;
  }

  /** Whether there is anywhere else to go. With one host the selector never probes. */
  hasAlternatives() {
    return this.#hosts.length > 1;
  }

  /** A sync session finishes on its endpoint, or fails, before the selector moves it elsewhere. */
  isSessionActive() {
    return this.#activeSessions > 0;
  }

  /**
   * Whether a connection that finds its endpoint failing may look for another one now: there is
   * somewhere else to go, this process is the one that probes, and no sync session is running.
   * Otherwise the connection stays where it is under its normal backoff.
   */
  canFailOver() {
    return this.#canProbe && this.hasAlternatives() && !this.isSessionActive();
  }

  beginSession() {
    this.#activeSessions += 1;
  }

  endSession() {
    this.#activeSessions = Math.max(0, this.#activeSessions - 1);
  }

  /**
   * Remembers which central `host` reached, as its login said, so that when it refuses the
   * credentials the other hosts reaching the same central are not asked as well. Central names
   * itself in the response to a login, and in nothing sooner, so this is only learned from logins
   * that succeeded.
   */
  learnIdentity(host, identity) {
    if (!identity) return;
    this.#identities.set(host, { identity, learnedAt: this.#now() });
  }

  #identityOf(host) {
    const known = this.#identities.get(host);
    if (!known) return null;
    if (this.#now() - known.learnedAt >= IDENTITY_TTL_MS) {
      this.#identities.delete(host);
      return null;
    }
    return known.identity;
  }

  /** `host` and the other hosts known to reach the same central as it does. */
  hostsOnSameServerAs(host) {
    const identity = this.#identityOf(host);
    if (identity === null) return [host];
    return this.#hosts.filter(other => other === host || this.#identityOf(other) === identity);
  }

  /**
   * Logs in at `host` with the sync credentials, on a client of its own so the live connection's
   * auth state is never disturbed, with a short timeout and a single attempt.
   * @returns {Promise<{ ok: true } | { ok: false, reason: string, credentialsRefused: boolean, lockedOut: boolean }>}
   */
  async probe(host) {
    const { email, password } = getSyncConfig();
    const { probeTimeoutMs } = await this.#getProbeSettings();
    const startedAt = Date.now();
    try {
      const client = this.#createProbeClient({ host, timeoutMs: probeTimeoutMs });
      const loginData = await client.login(email, password, {
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
      this.learnIdentity(host, loginData?.server?.centralHost);
      log.info('CentralEndpointSelector.probe', {
        host,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
      return { ok: true };
    } catch (error) {
      const reason = error.detail ?? error.message;
      log.warn('CentralEndpointSelector.probe', {
        host,
        outcome: 'failure',
        reason,
        durationMs: Date.now() - startedAt,
      });
      return {
        ok: false,
        reason,
        credentialsRefused: isLoginRefusal(error),
        lockedOut: error.type === ERROR_TYPE.RATE_LIMITED,
      };
    }
  }

  /**
   * One round of logins over `hosts`, resolving to the first that passes, or null. A round is
   * what the sync login backoff counts: it does not start while logins are paused, and when it
   * ends with credentials refused and nothing passing it lengthens the pause, however many hosts
   * refused. A lockout ends the round early, since the other hosts would refuse as well.
   * @param {string[]} hosts
   * @param {{ skip?: string[], shouldStop?: () => boolean }} [options] hosts not to try, and a
   * check before each probe for whether to give the round up. A host that refuses the credentials
   * also rules out the hosts known to reach the same central.
   */
  async firstPassing(hosts, { skip = [], shouldStop = () => false } = {}) {
    const backoff = getSyncLoginBackoff();
    if (!backoff.isOpen()) {
      log.info('CentralEndpointSelector: logins are paused, not probing', { hosts });
      return null;
    }

    const skipped = new Set(skip);
    let credentialsRefused = false;
    for (const host of hosts) {
      if (skipped.has(host)) continue;
      if (shouldStop()) return null;

      const result = await this.probe(host);
      if (result.ok) {
        backoff.recordSuccess();
        return host;
      }
      credentialsRefused ||= result.credentialsRefused;
      if (result.lockedOut) break;
      if (result.credentialsRefused) {
        for (const sameServer of this.hostsOnSameServerAs(host)) skipped.add(sameServer);
      }
    }

    if (credentialsRefused) await backoff.recordRefusal();
    return null;
  }

  /**
   * Probes the hosts from the top and moves to the first that passes. Concurrent callers share one
   * walk. Resolves to whether some host passed, which can be the host already in use.
   * @param {{ reason?: string, skip?: string[] }} [options] `skip` is for the hosts that have just
   * refused the credentials: asking them again would only count another failure against the
   * account.
   */
  walk({ reason, skip } = {}) {
    if (!this.#canProbe || !this.hasAlternatives()) return Promise.resolve(false);
    this.#walking ??= this.#walkHosts(reason, skip).finally(() => {
      this.#walking = null;
    });
    return this.#walking;
  }

  async #walkHosts(reason, skip) {
    log.info('CentralEndpointSelector.walk', { current: this.#current, reason, skip });
    const host = await this.firstPassing(this.#hosts, { skip });
    if (host === null) {
      log.warn('CentralEndpointSelector.walkFailed', { hosts: this.#hosts });
      return false;
    }
    await this.#use(host);
    return true;
  }

  /**
   * While on a host other than the first, checks the ones before it and moves to the
   * highest-priority one that passes. Skipped while a sync session is running or a walk is under
   * way. Resolves to whether it moved.
   */
  async recheckEarlier() {
    if (!this.#canProbe || this.isSessionActive() || this.#walking) return false;

    const currentIndex = this.#hosts.indexOf(this.#current);
    const earlier = this.#hosts.slice(0, currentIndex === -1 ? this.#hosts.length : currentIndex);
    const isBusy = () => this.isSessionActive() || this.#walking !== null;
    const host = await this.firstPassing(earlier, { shouldStop: isBusy });
    // a session or walk may have started while probing
    if (host === null || isBusy()) return false;
    await this.#use(host);
    return true;
  }

  /**
   * Takes a list central supplied whose entry `verifiedHost` has already passed a login. The
   * whole list replaces the recorded one and the verified host becomes the one in use.
   */
  async adopt(hosts, verifiedHost) {
    this.#hosts = [...hosts];
    await this.#use(verifiedHost);
  }

  /**
   * Starts the periodic recheck. Only the process that owns the central connection runs it.
   * @returns {() => void} stop
   */
  startRechecking() {
    let timer;
    let stopped = false;

    const scheduleNext = async () => {
      if (stopped) return;
      let intervalMs;
      try {
        ({ recheckIntervalMs: intervalMs } = await this.#getProbeSettings());
      } catch (error) {
        log.warn('CentralEndpointSelector.recheckSettingsFailed', { error: error.message });
        intervalMs = 5 * 60_000;
      }
      if (stopped) return;
      timer = setTimeout(async () => {
        try {
          await this.recheckEarlier();
        } catch (error) {
          log.warn('CentralEndpointSelector.recheckFailed', { error: error.message });
        }
        scheduleNext();
      }, intervalMs);
      timer.unref();
    };

    scheduleNext();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }

  /**
   * For processes without a central connection of their own: follows the host the sync process
   * publishes, and never probes.
   * @returns {() => void} stop
   */
  follow(intervalMs) {
    const refresh = async () => {
      try {
        const published = await this.#models.LocalSystemFact.get(FACT_CENTRAL_ENDPOINT_IN_USE);
        if (published && published !== this.#current) {
          this.#hosts = this.#hosts.includes(published) ? this.#hosts : [published, ...this.#hosts];
          await this.#use(published, { publish: false });
        }
      } catch (error) {
        log.warn('CentralEndpointSelector.followFailed', { error: error.message });
      }
    };

    refresh();
    const timer = setInterval(refresh, intervalMs);
    timer.unref();
    return () => clearInterval(timer);
  }

  async #use(host, { publish = true } = {}) {
    if (host === this.#current) {
      // still publish: the fact may be missing or stale after a restart
      if (publish) await this.#publish(host);
      return;
    }

    log.info('CentralEndpointSelector.switched', { from: this.#current, to: host });
    this.#current = host;
    if (publish) await this.#publish(host);
    this.emit('change', host);
  }

  async #publish(host) {
    try {
      await this.#models.LocalSystemFact.set(FACT_CENTRAL_ENDPOINT_IN_USE, host);
    } catch (error) {
      log.warn('CentralEndpointSelector.publishFailed', { host, error: error.message });
    }
  }
}

function createDefaultProbeClient(getDeviceId) {
  return ({ host, timeoutMs }) => {
    const url = new URL(host);
    url.pathname = '/api';
    const client = new TamanuApi({
      logger: log,
      endpoint: url.toString(),
      agentName: SERVER_TYPES.FACILITY,
      agentVersion: version,
      deviceId: getDeviceId(),
      defaultRequestConfig: { timeout: timeoutMs, waitForAuth: true, backoff: false },
    });
    if (process.env.TAMANU_DISABLE_FAITH_FETCH !== 'true') {
      client.fetchImplementation = faithFetch;
    }
    return client;
  };
}

let selector = null;

/**
 * The process's selector, or null when none has been set up (an unconfigured server, or a
 * process that does not use central). Connections fall back to the configured host then.
 */
export const getCentralEndpointSelector = () => selector;

export const setCentralEndpointSelector = next => {
  selector = next;
};

/** The central host connections should use: the selector's choice, else the configured host. */
export const getCurrentCentralHost = () => selector?.current() ?? getSyncConfig().host;
