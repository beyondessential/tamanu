import { Op } from 'sequelize';

import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { getModelsForPush } from '@tamanu/database/sync';

// Cap on models queried at once: each is its own query on the same connection pool the api uses
const MAX_CONCURRENT_QUERIES = 4;

const modelHasChangesSince = async (model, since) =>
  Boolean(
    await model.findOne({
      where: { updatedAtSyncTick: { [Op.gt]: since } },
      attributes: ['id'],
      raw: true,
      paranoid: false,
    }),
  );

/**
 * Whether the facility has any local change that the next sync would push: a row in a model that
 * pushes to central whose `updated_at_sync_tick` is above the last successful push cursor. It
 * selects the same rows as `snapshotOutgoingChanges`, but stops at the first hit rather than
 * reading them all.
 *
 * spec: SYNCHK#facility-servers
 */
export const hasUnpushedChanges = async models => {
  const since = (await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH)) || -1;
  const modelsToCheck = Object.values(getModelsForPush(models));

  // One generator shared by the workers, so each model is taken by exactly one of them, and the
  // first to find a change returns out of its loop, closing the generator and stopping the rest
  const unchecked = (function* () {
    yield* modelsToCheck;
  })();
  const worker = async () => {
    for (const model of unchecked) {
      if (await modelHasChangesSince(model, since)) return true;
    }
    return false;
  };
  const found = await Promise.all(Array.from({ length: MAX_CONCURRENT_QUERIES }, worker));
  return found.some(Boolean);
};
