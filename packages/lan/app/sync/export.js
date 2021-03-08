import { Op } from 'sequelize';
import { memoize, without, pick } from 'lodash';
import { propertyPathsToTree } from './metadata';

export const createExportPlan = memoize(model => {
  const relationTree = propertyPathsToTree(model.includedSyncRelations);
  return createExportPlanInner(model, relationTree);
});

const createExportPlanInner = (model, relationTree, foreignKey = null) => {
  const associations = Object.entries(relationTree).reduce((memo, [associationName, subTree]) => {
    const association = model.associations[associationName];
    return {
      ...memo,
      [associationName]: createExportPlanInner(association.target, subTree, association.foreignKey),
    };
  }, {});

  const allColumns = Object.keys(model.tableAttributes);
  const columns = without(allColumns, ...model.excludedSyncColumns);

  return { model, associations, foreignKey, columns };
};

export const executeExportPlan = async (plan, { after, limit = 100 }) => {
  const options = {
    where: {
      markedForPush: true,
    },
    order: [['id', 'ASC']],
  };
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
    // format as a syncRecord
    const syncRecord = { data: sanitiseRecord(pick(dbRecord.dataValues, columns)) };

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

const sanitiseRecord = record =>
  Object.entries(record).reduce((memo, [k, v]) => ({ ...memo, [k]: sanitiseField(v) }), {});

const sanitiseField = value => {
  // TODO: generate functions to do this per-field in createExportPlan
  // TODO: implement equivalent in createImportPlan
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return null;
};
