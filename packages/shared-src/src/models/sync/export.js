import { Sequelize } from 'sequelize';
import { memoize, without } from 'lodash';
import { propertyPathsToTree } from './metadata';
import { getSyncCursorFromRecord, syncCursorToWhereCondition } from './cursor';

export const createExportPlan = memoize(model => {
  const relationTree = propertyPathsToTree(model.includedSyncRelations);
  return createExportPlanInner(model, relationTree, model.syncParentIdKey);
});

const createExportPlanInner = (model, relationTree, foreignKey) => {
  // generate nested association exporters
  const associations = Object.entries(relationTree).reduce((memo, [associationName, subTree]) => {
    const association = model.associations[associationName];
    return {
      ...memo,
      [associationName]: createExportPlanInner(association.target, subTree, association.foreignKey),
    };
  }, {});

  // generate formatters for columns
  const allColumnNames = Object.keys(model.tableAttributes);
  const columns = without(allColumnNames, ...model.excludedSyncColumns).reduce(
    (memo, columnName) => {
      const columnType = model.tableAttributes[columnName].type;
      let formatter = null; // default to passing the value straight through
      if (columnType instanceof Sequelize.DATE) {
        formatter = date => date?.toISOString();
      }
      return { ...memo, [columnName]: formatter };
    },
    {},
  );

  return { model, associations, foreignKey, columns };
};

export const executeExportPlan = async (plan, channel, { since, limit = 100 }) => {
  const { model, foreignKey } = plan;
  const { syncClientMode } = model;
  const options = {
    where: {},
    order: [
      // order by clause must remain consistent for the sync cursor to work - don't change!
      ['updated_at', 'ASC'],
      ['id', 'ASC'],
    ],
  };
  if (syncClientMode) {
    // only push marked records in server mode
    options.where.markedForPush = true;
  }
  if (!syncClientMode) {
    // load deleted records in server mode
    options.paranoid = false;
  }
  if (foreignKey) {
    const parentId = model.syncParentIdFromChannel(channel);
    if (!parentId) {
      throw new Error(
        `Must provide parentId for models like ${plan.model.name} with syncParentIdKey set`,
      );
    }
    options.where[foreignKey] = parentId;
  }
  if (limit) {
    options.limit = limit;
  }
  if (since) {
    options.where = {
      ...options.where,
      ...syncCursorToWhereCondition(since),
    };
  }

  return executeExportPlanInner(plan, options);
};

const executeExportPlanInner = async ({ model, associations, columns }, options) => {
  // query records
  const dbRecords = await model.findAll(options);

  const syncRecords = [];
  for (const dbRecord of dbRecords) {
    const syncRecord = { data: {} };

    // add lastSynced (if we're not in client mode)
    if (!model.syncClientMode) {
      syncRecord.lastSynced = dbRecord.updatedAt.valueOf();
    }

    if (!model.syncClientMode && dbRecord.deletedAt) {
      // don't return any data for tombstones
      syncRecord.data.id = dbRecord.id;
      syncRecord.isDeleted = true;
    } else {
      // pick and format columns
      for (const [columnName, columnFormatter] of Object.entries(columns)) {
        const value = dbRecord[columnName];
        syncRecord.data[columnName] = columnFormatter ? columnFormatter(value) : value;
      }

      // query associations
      for (const [associationName, associationPlan] of Object.entries(associations)) {
        const associationOptions = {
          where: { [associationPlan.foreignKey]: dbRecord.id },
        };
        const { records: innerRecords } = await executeExportPlanInner(
          associationPlan,
          associationOptions,
        );
        syncRecord.data[associationName] = innerRecords;
      }
    }

    syncRecords.push(syncRecord);
  }

  // records already sorted by updatedAt then id, get the sync cursor from the last item
  const maxRecord = dbRecords[dbRecords.length - 1];
  const cursor = maxRecord && getSyncCursorFromRecord(maxRecord);
  return { records: syncRecords, cursor };
};
