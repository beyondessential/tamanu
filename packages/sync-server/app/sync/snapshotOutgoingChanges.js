import config from 'config';
import { Op } from 'sequelize';
import { sanitizeRecord, SYNC_SESSION_DIRECTION } from 'shared/sync';
import { log } from 'shared/services/logging/log';

const { readOnly, persistedCacheBatchSize } = config.sync;

// The hardest thing about sync is knowing what happens at the clock tick border - do we want
// records strictly >, or >= the cursor being requested? We use strict > for the following reasons:
// - Push to central server: because we save the local tick as it was before the push started as the
//   successful push tick, and increment the local clock just before taking the local snapshot to
//   push, we know that any changes since starting the push will be recorded using a higher tick.
//   There is the possibility of changes that are made between the time we increment the local clock
//   and the time we finish the snapshot being pushed twice, but that's ok because pushing a change
//   is idempotent (actually not quite under the current conflict resolution model, but good enough)
// - Pull from central server: using > here just means we definitely don't get any of the same
//   changes twice, though see above for why it wouldn't actually be a big deal if we did

const snapshotChangesForModel = async (
  model,
  models,
  since,
  patientIds,
  sessionId,
  sessionConfig,
) => {
  const modelHasSyncFilter = !!model.buildSyncFilter;
  const modelSyncFilter = modelHasSyncFilter && model.buildSyncFilter(patientIds, sessionConfig);
  if (modelHasSyncFilter && modelSyncFilter === null) {
    // if model has sync filter but it is built as null, it indicates no records will be available
    // so no point in going further (e.g. patientIds is empty, so a patient linked filter will
    // produce no data)
    return 0;
  }

  const queryOptions = {
    ...modelSyncFilter,
    where: { updatedAtSyncTick: { [Op.gt]: since }, ...modelSyncFilter.where },
  };

  const recordsChangedCount = await model.count(queryOptions);
  const batchCount = Math.ceil(recordsChangedCount / persistedCacheBatchSize);

  let cursorId = '00000000-0000-0000-0000-000000000000';
  for (let batchNumber = 0; batchNumber < batchCount; batchNumber++) {
    const recordsChanged = await model.findAll({
      ...queryOptions,
      where: { ...queryOptions.where, id: { [Op.gt]: cursorId } },
      order: [['id', 'ASC']], // need some ordering so that paging works
      limit: persistedCacheBatchSize,
    });
    const sanitizedRecords = recordsChanged.map(r => ({
      sessionId,
      direction: SYNC_SESSION_DIRECTION.OUTGOING,
      isDeleted: !!r.deletedAt,
      recordType: model.tableName,
      recordId: r.id,
      savedAtSyncTick: r.updatedAtSyncTick,
      data: sanitizeRecord(model, r),
    }));

    await models.SyncSessionRecord.bulkCreate(sanitizedRecords);
    cursorId = sanitizedRecords[sanitizedRecords.length - 1].recordId;
  }

  log.debug(
    `snapshotChangesForModel: Found ${recordsChangedCount} for model ${model.tableName} since ${since}, in session ${sessionId}`,
  );

  return recordsChangedCount;
};

export const snapshotOutgoingChanges = async (
  outgoingModels,
  models,
  since,
  patientIds,
  sessionId,
  sessionConfig,
) => {
  if (readOnly) {
    return [];
  }

  let changesCount = 0;

  for (const model of Object.values(outgoingModels)) {
    const modelChangesCount = await snapshotChangesForModel(
      model,
      models,
      since,
      patientIds,
      sessionId,
      sessionConfig,
    );

    changesCount += modelChangesCount || 0;
  }

  log.debug(
    `snapshotChangesForModel: Found a total of ${changesCount} for all models since ${since}, in session ${sessionId}`,
  );

  return changesCount;
};
