import { SYNC_PHASES_VALUES } from '@tamanu/constants';
import {
  FACT_INITIAL_SYNC_PHASE,
  FACT_INITIAL_SYNC_PULL_FLOOR,
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
 * Record that a phase has landed, and return the phase to run next, or null if that was the last.
 *
 * Runs inside the transaction that saves the phase's records, so a phase's data and its progress
 * through the phases land together.
 *
 * Each phase pulls from the beginning of the sync timeline but is snapshotted at a different tick,
 * so the only tick every phase's models have been pulled up to is the earliest of them. That
 * earliest tick becomes the pull cursor once the last phase lands: changes to an early phase's
 * models made while the later phases ran fall after it, and are picked up by the next sync.
 */
export const completeInitialSyncPhase = async (models, phase, pullUntil) => {
  const previousFloor = await models.LocalSystemFact.get(FACT_INITIAL_SYNC_PULL_FLOOR);
  const pullFloor =
    previousFloor === null ? pullUntil : Math.min(parseInt(previousFloor, 10), pullUntil);

  const nextPhase = phaseAfter(phase);
  if (nextPhase === null) {
    await models.LocalSystemFact.set(FACT_LAST_SUCCESSFUL_SYNC_PULL, `${pullFloor}`);
    // cleared by value rather than removed: facts are soft-deleted, and a removed row still holds the
    // unique key, so a later write of the same fact would collide with it
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, null);
    await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PULL_FLOOR, null);
    return null;
  }

  await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PULL_FLOOR, `${pullFloor}`);
  await models.LocalSystemFact.set(FACT_INITIAL_SYNC_PHASE, `${nextPhase}`);
  return nextPhase;
};
