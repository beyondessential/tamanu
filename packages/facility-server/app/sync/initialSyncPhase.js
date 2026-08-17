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
 * Held in a fact, so it outlives a restart or a failed phase.
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
 * The phase a facility's first sync is up to, or null when it isn't performing one.
 *
 * Read on the liveness check, which otherwise answers without touching the database, so a database
 * it can't reach must report no phase rather than fail the check.
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
 * The tick the previous phase was snapshotted up to, which is where this phase resumes the earlier
 * phases' tables from. -1 for the first phase, i.e. the beginning of the sync timeline.
 */
export const getPhaseCatchUpSince = async models => {
  const pulledUpTo = await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULLED_UP_TO);
  return pulledUpTo === null ? -1 : parseInt(pulledUpTo, 10);
};

/**
 * Record that a phase has landed, and return the phase to run next, or null if that was the last.
 *
 * Runs inside the transaction that saves the phase's records, so data and progress land together.
 * The last phase's tick becomes the pull cursor.
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
