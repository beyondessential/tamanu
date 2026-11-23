import config from 'config';
import { chunk, groupBy } from 'es-toolkit/compat';
import { log } from '@tamanu/shared/services/logging';
import {
  getModelsForPull,
  saveChangesForModel,
  SYNC_TICK_FLAGS,
  withDeferredSyncSafeguards,
} from '@tamanu/database/sync';
import { sortInDependencyOrder } from '@tamanu/database/utils/sortInDependencyOrder';
import { pauseAudit } from '@tamanu/database/utils/audit';

// Rows central never sent were seeded by migrations, and collide by key with central's copies
export async function clearLocallyAuthoredSettings(sequelize) {
  await sequelize.transaction(async () => {
    // Unpaused, the changelog would record each deleted row, secret included.
    await pauseAudit(sequelize);
    await sequelize.query(
      'DELETE FROM settings WHERE facility_id IS NULL AND updated_at_sync_tick <> :fromCentral',
      { replacements: { fromCentral: SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE } },
    );
  });
}

// spec: FBOOT#applying-the-bootstrap
// Saves the records central serves for a facility bootstrap the way the first sync saves pulled
// records, so a facility can be logged into before that sync completes. Must run inside a
// transaction, which the caller shares with anything that has to land alongside the bootstrap.
export async function applyBootstrap({ sequelize, models }, records) {
  await clearLocallyAuthoredSettings(sequelize);
  const recordsByType = groupBy(records, 'recordType');
  const bootstrappedModels = Object.fromEntries(
    Object.entries(getModelsForPull(models)).filter(([, model]) => recordsByType[model.tableName]),
  );

  await pauseAudit(sequelize);
  await withDeferredSyncSafeguards(sequelize, async () => {
    for (const model of sortInDependencyOrder(bootstrappedModels)) {
      const changes = recordsByType[model.tableName].map(record => ({
        ...record,
        // as a pulled record is: never pushed back to central on account of the bootstrap
        data: { ...record.data, updatedAtSyncTick: SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER },
      }));
      for (const batch of chunk(changes, config.sync.persistedCacheBatchSize)) {
        await saveChangesForModel(model, batch, false, log);
      }
    }
  });

  log.info('FacilityBootstrap.applied', { count: records.length });
}
