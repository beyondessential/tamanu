import config from 'config';
import { Op } from 'sequelize';
import { SYNC_SESSION_DIRECTION } from 'shared/constants';
import { log } from 'shared/services/logging/log';
import { sanitizeRecord } from 'shared/sync';

const { readOnly } = config.sync;

const snapshotChangesForModel = async (model, sessionId, since) => {
  const recordsChanged = await model.findAll({ where: { updatedAtSyncTick: { [Op.gt]: since } } });

  log.debug(
    `snapshotChangesForModel: Found ${recordsChanged.length} for model ${model.tableName} since ${since}`,
  );

  return recordsChanged.map(r => ({
    sessionId,
    direction: SYNC_SESSION_DIRECTION.OUTGOING,
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    recordId: r.id,
    data: sanitizeRecord(model, r),
  }));
};

export const snapshotOutgoingChanges = async (models, sessionId, since) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(model, sessionId, since);
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
