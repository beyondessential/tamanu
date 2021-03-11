import { Op, Sequelize } from 'sequelize';
import { memoize, without } from 'lodash';
import { propertyPathsToTree } from './metadata';

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

export const executeExportPlan = async (plan, channel, { after, limit = 100 }) => {
  const options = {
    where: {
      markedForPush: true,
    },
    order: [['id', 'ASC']],
  };
  if (plan.foreignKey) {
    const parentId = plan.model.syncParentIdFromChannel(channel);
    if (!parentId) {
      throw new Error('Must provide parentId for models like ${plan.model.name} with syncParentIdKey set');
    }
    options.where[plan.foreignKey] = parentId;
  }
  if (limit) {
    options.limit = limit;
  }
  if (after) {
    options.where.id = { [Op.gt]: after.data.id };
  }

  return executeExportPlanInner(plan, options);
};

export const executeExportPlanInner = async ({ model, associations, columns }, options) => {
  // query records
  const dbRecords = await model.findAll(options);

  const syncRecords = [];
  for (const dbRecord of dbRecords) {
    // format columns
    const syncRecord = { data: {} };
    for (const [columnName, columnFormatter] of Object.entries(columns)) {
      const value = dbRecord[columnName];
      syncRecord.data[columnName] = columnFormatter ? columnFormatter(value) : value;
    }

    // query associations
    for (const [associationName, associationPlan] of Object.entries(associations)) {
      const associationOptions = {
        where: { [associationPlan.foreignKey]: dbRecord.id },
      };
      syncRecord.data[associationName] = await executeExportPlanInner(
        associationPlan,
        associationOptions,
      );
    }
    syncRecords.push(syncRecord);
  }

  return syncRecords;
};
