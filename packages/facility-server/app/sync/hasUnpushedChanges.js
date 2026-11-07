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

  // A batch at a time, so the whole set of models cannot take a connection each, and so the
  // first batch holding a change stops the rest
  for (let from = 0; from < modelsToCheck.length; from += MAX_CONCURRENT_QUERIES) {
    const batch = modelsToCheck.slice(from, from + MAX_CONCURRENT_QUERIES);
    const found = await Promise.all(batch.map(model => modelHasChangesSince(model, since)));
    if (found.some(Boolean)) return true;
  }
  return false;
};
