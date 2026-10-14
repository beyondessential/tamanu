import { ERROR_TYPE, RateLimitedError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

import { getSyncConfig } from '../serverConfig';

// A refused login counts toward central's lockout, which is per account and device, so once
// credentials are refused the pause has to pass the lockout's observation window within a couple
// of steps. Anything else (an unreachable endpoint, say) never pauses, and keeps retrying under
// the usual backoff.
const BACKOFF_FACTOR = 5;
const DEFAULT_SETTINGS = { initialDelayMs: 120_000, maxDelayMs: 3_600_000 };

// spec: CEND
/** Whether central answered a login by refusing the credentials, or locking the account out. */
export const isLoginRefusal = error =>
  error?.type === ERROR_TYPE.AUTH_CREDENTIAL_INVALID || error?.type === ERROR_TYPE.RATE_LIMITED;

const credentialKeyOf = () => {
  const { email, password } = getSyncConfig();
  return `${email}\u0000${password}`;
};

/**
 * Pauses logins with the sync credentials after central refuses them, for longer each time the
 * refusals repeat. A successful login, or a change of credentials, ends the pause.
 *
 * Refusals that arrive while already paused belong to the same round of attempts and neither
 * lengthen the pause nor restart it.
 */
export class SyncLoginBackoff {
  #getSettings;
  #now;
  #getCredentialKey;
  #refusals = 0;
  #pausedUntil = 0;
  #credentialKey = null;

  constructor({
    getSettings = async () => DEFAULT_SETTINGS,
    now = Date.now,
    getCredentialKey = credentialKeyOf,
  } = {}) {
    this.#getSettings = getSettings;
    this.#now = now;
    this.#getCredentialKey = getCredentialKey;
  }

  // credentials changed since the refusals, so they say nothing about the new ones
  #forgetRefusalsOfOtherCredentials() {
    const key = this.#getCredentialKey();
    if (key !== this.#credentialKey) {
      this.#credentialKey = key;
      this.#refusals = 0;
      this.#pausedUntil = 0;
    }
  }

  /** Whether a login may be attempted now. */
  isOpen() {
    this.#forgetRefusalsOfOtherCredentials();
    return this.#now() >= this.#pausedUntil;
  }

  /** Throws when logins are paused, saying for how long. */
  check() {
    if (this.isOpen()) return;
    const remainingSeconds = Math.ceil((this.#pausedUntil - this.#now()) / 1000);
    throw new RateLimitedError(
      remainingSeconds,
      `Logins with the sync credentials are paused for ${remainingSeconds}s after central refused them`,
    );
  }

  async recordRefusal() {
    const { initialDelayMs, maxDelayMs } = await this.#getSettings();
    // checked after the settings read, so concurrent refusals of one round cannot both lengthen it
    if (!this.isOpen()) return;
    const delayMs = Math.min(maxDelayMs, initialDelayMs * BACKOFF_FACTOR ** this.#refusals);
    this.#refusals += 1;
    this.#pausedUntil = this.#now() + delayMs;
    log.warn('SyncLoginBackoff: central refused the sync credentials, pausing logins', {
      refusals: this.#refusals,
      pauseSeconds: Math.round(delayMs / 1000),
    });
  }

  recordSuccess() {
    this.#forgetRefusalsOfOtherCredentials();
    this.#refusals = 0;
    this.#pausedUntil = 0;
  }
}

let backoff = new SyncLoginBackoff();

/** The process's login backoff. Every login with the sync credentials goes through it. */
export const getSyncLoginBackoff = () => backoff;

export const setSyncLoginBackoff = next => {
  backoff = next;
};
