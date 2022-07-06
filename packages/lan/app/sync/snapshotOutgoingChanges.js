import config from 'config';
import { Op } from 'sequelize';

import { shouldPush } from 'shared/models/sync';

const { readOnly } = config.sync;

const snapshotChangesForModel = async (model, cursor) => {
  const recordsChanged = await model.findAll({
    updatedAt: { [Op.gt]: cursor }, // updatedAt is set on all creates, updates, and deletes
  });
  return recordsChanged.map(r => ({
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    timestamp: r.updatedAt,
    data: r,
  }));
};

export const snapshotOutgoingChanges = async (models, cursor) => {
  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    if (!readOnly && shouldPush(model)) {
      const changesForModel = await snapshotChangesForModel(model, cursor);
      outgoingChanges.push(...changesForModel);
    }
  }
  return outgoingChanges;
};
