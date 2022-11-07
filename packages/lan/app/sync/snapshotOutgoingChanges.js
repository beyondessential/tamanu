import { Op, Transaction } from 'sequelize';

import { log } from 'shared/services/logging/log';
import { COLUMNS_EXCLUDED_FROM_SYNC, SYNC_SESSION_DIRECTION } from 'shared/sync';
import { withConfig } from 'shared/utils/withConfig';

const sanitizeRecord = record =>
  Object.fromEntries(
    Object.entries(record)
      // don't sync metadata columns like updatedAt
      .filter(([c]) => !COLUMNS_EXCLUDED_FROM_SYNC.includes(c)),
  );

const snapshotChangesForModel = async (model, sessionId, since) => {
  const recordsChanged = await model.findAll({
    where: { updatedAtSyncTick: { [Op.gt]: since } },
    raw: true,
  });

  log.debug(
    `snapshotChangesForModel: Found ${recordsChanged.length} for model ${model.tableName} since ${since}`,
  );

  return recordsChanged.map(r => ({
    sessionId,
    direction: SYNC_SESSION_DIRECTION.OUTGOING,
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    recordId: r.id,
    data: sanitizeRecord(r),
  }));
};

export const snapshotOutgoingChanges = withConfig(
  async (sequelize, models, sessionId, since, config) => {
    if (config.sync.readOnly) {
      return [];
    }

    // snapshot inside a "repeatable read" transaction, so that other changes made while this snapshot
    // is underway aren't included (as this could lead to a pair of foreign records with the child in
    // the snapshot and its parent missing)
    // as the snapshot only contains read queries, there will be no concurrent update issues :)
    return sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async () => {
        const outgoingChanges = [];
        for (const model of Object.values(models)) {
          const changesForModel = await snapshotChangesForModel(model, sessionId, since);
          outgoingChanges.push(...changesForModel);
        }
        return outgoingChanges;
      },
    );
  },
);
