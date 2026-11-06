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

  let found = false;
  let nextIndex = 0;
  const worker = async () => {
    while (!found && nextIndex < modelsToCheck.length) {
      const model = modelsToCheck[nextIndex++];
      if (await modelHasChangesSince(model, since)) found = true;
    }
  };
  await Promise.all(Array.from({ length: MAX_CONCURRENT_QUERIES }, worker));
  return found;
};
