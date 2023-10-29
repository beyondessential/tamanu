import { Op, Transaction } from 'sequelize';

import { log } from '@tamanu/shared/services/logging/log';
import { COLUMNS_EXCLUDED_FROM_SYNC, SYNC_SESSION_DIRECTION } from '@tamanu/shared/sync';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

const sanitizeRecord = record =>
  Object.fromEntries(
    Object.entries(record)
      // don't sync metadata columns like updatedAt
      .filter(([c]) => !COLUMNS_EXCLUDED_FROM_SYNC.includes(c)),
  );

const snapshotChangesForModel = async (model, since, transaction) => {
  const recordsChanged = await model.findAll({
    where: { updatedAtSyncTick: { [Op.gt]: since } },
    raw: true,
    transaction,
  });

  log.debug(
    `snapshotChangesForModel: Found ${recordsChanged.length} for model ${model.tableName} since ${since}`,
  );

  return recordsChanged.map(r => ({
    direction: SYNC_SESSION_DIRECTION.OUTGOING,
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    recordId: r.id,
    data: sanitizeRecord(r),
  }));
};

export const snapshotOutgoingChanges = withConfig(async (sequelize, models, since) => {
  const invalidModelNames = Object.values(models)
    .filter(
      m =>
        ![SYNC_DIRECTIONS.BIDIRECTIONAL, SYNC_DIRECTIONS.PUSH_TO_CENTRAL].includes(m.syncDirection),
    )
    .map(m => m.tableName);

  if (invalidModelNames.length) {
    throw new Error(
      `Invalid sync direction(s) when pushing these models from facility: ${invalidModelNames}`,
    );
  }

  // snapshot inside a "repeatable read" transaction, so that other changes made while this snapshot
  // is underway aren't included (as this could lead to a pair of foreign records with the child in
  // the snapshot and its parent missing)
  // as the snapshot only contains read queries, there will be no concurrent update issues :)
  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async transaction => {
      let outgoingChanges = [];
      for (const model of Object.values(models)) {
        const changesForModel = await snapshotChangesForModel(model, since, transaction);
        outgoingChanges = outgoingChanges.concat(changesForModel);
      }
      return outgoingChanges;
    },
  );
});
