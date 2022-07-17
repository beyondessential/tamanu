import config from 'config';
import { Op, DATE } from 'sequelize';

const { readOnly } = config.sync;

const COLUMNS_EXCLUDED_FROM_SYNC = [
  'createdAt',
  'updatedAt',
  'markedForPush',
  'markedForSync',
  'isPushing',
];

const snapshotChangesForModel = async (model, sinceSessionIndex) => {
  const recordsChanged = await model.findAll({
    where: {
      updatedSinceSession: { [Op.gte]: sinceSessionIndex }, // updatedSinceSession is set on all creates, updates, and soft deletes
    },
  });

  const sanitizeRecord = record =>
    Object.fromEntries(
      Object.keys(model.tableAttributes)
        // don't sync metadata columns like updatedAt
        .filter(c => !COLUMNS_EXCLUDED_FROM_SYNC.includes(c))
        // sanitize values, e.g. dates to iso strings
        .map(name => {
          const columnType = model.tableAttributes[name].type;
          const value = columnType instanceof DATE ? record[name]?.toISOString() : record[name];
          return [name, value];
        }),
    );

  return recordsChanged.map(r => ({
    isDeleted: !!r.deletedAt,
    recordType: model.tableName,
    data: sanitizeRecord(r),
  }));
};

export const snapshotOutgoingChanges = async (models, sinceSessionIndex) => {
  if (readOnly) {
    return [];
  }

  const outgoingChanges = [];
  for (const model of Object.values(models)) {
    const changesForModel = await snapshotChangesForModel(model, sinceSessionIndex);
    outgoingChanges.push(...changesForModel);
  }
  return outgoingChanges;
};
