import { FACT_LAST_SUCCESSFUL_SYNC_PUSH } from '@tamanu/constants/facts';
import { getModelsForPush } from '@tamanu/database/sync';

import { outgoingChangesQuery } from './snapshotOutgoingChanges';

/**
 * Whether the next sync would push anything; reads only until the first row.
 * spec: SYNCHK#facility-servers
 */
export const hasUnpushedChanges = async models => {
  const since = (await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PUSH)) || -1;
  for (const model of Object.values(getModelsForPush(models))) {
    if (await model.findOne({ ...outgoingChangesQuery(since), attributes: ['id'] })) return true;
  }
  return false;
};
