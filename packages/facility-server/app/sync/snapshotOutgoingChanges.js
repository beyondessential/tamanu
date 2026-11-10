import { Op, Transaction } from 'sequelize';

import { log } from '@tamanu/shared/services/logging/log';
import { sanitizeRecord, SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import { SYNC_DIRECTIONS } from '@tamanu/constants';

// The rows a push sends: every row of a model changed since the last successful push, deleted ones
// included. Shared with `hasUnpushedChanges`, which must select the same rows.
export const outgoingChangesQuery = since => ({
  where: { updatedAtSyncTick: { [Op.gt]: since } },
  raw: true,
  paranoid: false,
});

const snapshotChangesForModel = async (model, since, transaction) => {
  const recordsChanged = await model.findAll({ ...outgoingChangesQuery(since), transaction });

  log.debug(
    `snapshotChangesForModel: Found ${recordsChanged.length} for model ${model.tableName} since ${since}`,
  );

  return recordsChanged.map((r) => ({
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
      (m) =>
        ![
          SYNC_DIRECTIONS.BIDIRECTIONAL,
          SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
          SYNC_DIRECTIONS.PUSH_TO_CENTRAL_THEN_DELETE,
        ].includes(m.syncDirection),
    )
    .map((m) => m.tableName);

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
    async (transaction) => {
      let outgoingChanges = [];
      for (const model of Object.values(models)) {
        const changesForModel = await snapshotChangesForModel(model, since, transaction);
        outgoingChanges = outgoingChanges.concat(changesForModel);
      }
      return outgoingChanges;
    },
  );
});
