import { SYNC_PHASE_LABELS, SYNC_PHASES_VALUES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import {
  FACT_INITIAL_SYNC_PHASE,
  FACT_INITIAL_SYNC_PULLED_UP_TO,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
} from '@tamanu/constants/facts';

const PHASE_ORDER = [...SYNC_PHASES_VALUES].sort((a, b) => a - b);
const FIRST_PHASE = PHASE_ORDER[0];

const phaseAfter = phase => PHASE_ORDER[PHASE_ORDER.indexOf(phase) + 1] ?? null;

/**
 * Which phase of the initial sync this run should perform, or null for an ordinary unphased sync.
 *
 * A facility with no pull cursor has never completed a pull, so it starts at the first phase; from
 * then on the phase it is up to is held in a fact, and outlives a restart or a failed phase.
 */
export const getInitialSyncPhase = async models => {
  const phase = await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE);
  if (phase !== null) return parseInt(phase, 10);

  const pullCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL);
  if (pullCursor !== null) return null;

  await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, `${FIRST_PHASE}`);
  return FIRST_PHASE;
};

/**
 * The phase a facility's first sync is up to, named for display, or null when it isn't performing
 * one.
 *
 * This is read on the liveness check, which otherwise answers without touching the database at all,
 * so a database that can't be reached reports no phase rather than taking the liveness check - and
 * with it the whole app's idea of whether the server is up - down alongside it.
 */
export const getInitialSyncPhaseLabel = async models => {
  try {
    const phase = await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PHASE);
    return phase === null ? null : SYNC_PHASE_LABELS[parseInt(phase, 10)];
  } catch (error) {
    log.warn('getInitialSyncPhaseLabel.failed', { error: error.message });
    return null;
  }
};

/**
 * The tick the phase before this one was snapshotted up to, which is where this phase resumes the
 * earlier phases' tables from. The first phase has nothing before it, so it starts from the
 * beginning of the sync timeline.
 */
export const getPhaseCatchUpSince = async models => {
  const pulledUpTo = await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULLED_UP_TO);
  return pulledUpTo === null ? -1 : parseInt(pulledUpTo, 10);
};

/**
 * Record that a phase has landed, and return the phase to run next, or null if that was the last.
 *
 * Runs inside the transaction that saves the phase's records, so a phase's data and its progress
 * through the phases land together.
 *
 * A phase pulls its own tables from the beginning of the sync timeline and every earlier phase's
 * tables from where the phase before it stopped, so on completion everything up to and including
 * this phase is current as of the tick it was snapshotted at. That tick is what the next phase
 * resumes from, and the last phase's tick becomes the pull cursor.
 */
export const completeInitialSyncPhase = async (models, phase, pullUntil) => {
  const nextPhase = phaseAfter(phase);
  if (nextPhase === null) {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, `${pullUntil}`);
    // cleared by value rather than removed: facts are soft-deleted, and a removed row still holds the
    // unique key, so a later write of the same fact would collide with it
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, null);
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PULLED_UP_TO, null);
    return null;
  }

  await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PULLED_UP_TO, `${pullUntil}`);
  await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, `${nextPhase}`);
  return nextPhase;
};
