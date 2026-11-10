import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { getModelsForPush } from '@tamanu/database/sync';

import { outgoingChangesQuery } from './snapshotOutgoingChanges';

/**
 * Whether the facility has any local change that the next sync would push: a row in a model that
 * pushes to central whose `updated_at_sync_tick` is above the last successful push cursor. It
 * selects with the same query as `snapshotOutgoingChanges`, but stops at the first hit rather than
 * reading them all. Each model is one probe of its sync tick index, so they run one at a time.
 *
 * spec: SYNCHK#facility-servers
 */
export const hasUnpushedChanges = async models => {
  const since = (await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH)) || -1;
  for (const model of Object.values(getModelsForPush(models))) {
    if (await model.findOne({ ...outgoingChangesQuery(since), attributes: ['id'] })) return true;
  }
  return false;
};
