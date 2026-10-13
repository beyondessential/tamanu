import { EventEmitter } from 'node:events';

import { TamanuApi } from '@tamanu/api-client';
import { DEVICE_SCOPES, FACT_CENTRAL_ENDPOINT_IN_USE, SERVER_TYPES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { version } from '../serverInfo';
import { getSyncConfig } from '../serverConfig';
import { faithFetch } from './faithFetch';

// spec: CEND
// Holds the ordered list of central hosts a facility server tries and the one it is using.
//
// The sync process owns the choice: it walks the list when the endpoint in use stops working and
// periodically rechecks earlier endpoints. Other processes (the API process) only follow what the
// sync process publishes through FACT_CENTRAL_ENDPOINT_IN_USE and never probe. A host is only ever
// chosen after a login at it succeeds.
export class CentralEndpointSelector extends EventEmitter {
  #models;
  #hosts;
  #current;
  #getProbeSettings;
  #createProbeClient;
  #canProbe;
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
   * @param {(args: { host: string, timeoutMs: number }) => { login: Function }} [args.createProbeClient]
   */
  constructor({
    models,
    hosts,
    inUse = null,
    getDeviceId,
    getProbeSettings,
    canProbe = true,
    createProbeClient = createDefaultProbeClient(getDeviceId),
  }) {
    super();
    this.#models = models;
    this.#hosts = [...hosts];
    this.#current = inUse && hosts.includes(inUse) ? inUse : (hosts[0] ?? null);
    this.#getProbeSettings = getProbeSettings;
    this.#createProbeClient = createProbeClient;
    this.#canProbe = canProbe;
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
   * Logs in at `host` with the sync credentials, on a client of its own so the live connection's
   * auth state is never disturbed, with a short timeout and a single attempt.
   * @returns {Promise<{ ok: true } | { ok: false, reason: string }>}
   */
  async probe(host) {
    const { email, password } = getSyncConfig();
    const { probeTimeoutMs } = await this.#getProbeSettings();
    const startedAt = Date.now();
    try {
      const client = this.#createProbeClient({ host, timeoutMs: probeTimeoutMs });
      await client.login(email, password, { scopes: [DEVICE_SCOPES.SYNC_CLIENT] });
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
      return { ok: false, reason };
    }
  }

  /**
   * Probes the hosts from the top and moves to the first that passes. Concurrent callers share one
   * walk. Resolves to whether some host passed, which can be the host already in use.
   */
  walk({ reason } = {}) {
    if (!this.#canProbe || !this.hasAlternatives()) return Promise.resolve(false);
    this.#walking ??= this.#walkHosts(reason).finally(() => {
      this.#walking = null;
    });
    return this.#walking;
  }

  async #walkHosts(reason) {
    log.info('CentralEndpointSelector.walk', { current: this.#current, reason });
    for (const host of this.#hosts) {
      if ((await this.probe(host)).ok) {
        await this.#use(host);
        return true;
      }
    }
    log.warn('CentralEndpointSelector.walkFailed', { hosts: this.#hosts });
    return false;
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
    for (const host of earlier) {
      // a session or walk may have started during the previous probe
      if (this.isSessionActive() || this.#walking) return false;
      if ((await this.probe(host)).ok) {
        // or during this one
        if (this.isSessionActive() || this.#walking) return false;
        await this.#use(host);
        return true;
      }
    }
    return false;
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
