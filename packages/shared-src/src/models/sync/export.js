import { Sequelize } from 'sequelize';
import { without } from 'lodash';
import { propertyPathsToTree } from './metadata';
import { getSyncCursorFromRecord, syncCursorToWhereCondition } from './cursor';

import {
  paramsToParentIdConfigs,
  associationToParentIdConfigs,
  extractStaticParentIds,
  extractDynamicParentIds,
} from './parentIds';

export const createExportPlan = (sequelize, channel) => {
  return sequelize.channelRouter(channel, (model, params) => {
    const relationTree = propertyPathsToTree(model.includedSyncRelations);
    const parentIdConfigs = paramsToParentIdConfigs(params);
    return createExportPlanInner(model, relationTree, parentIdConfigs);
  });
};

const createExportPlanInner = (model, relationTree, parentIdConfigs) => {
  // generate nested association exporters
  const associations = Object.entries(relationTree).reduce((memo, [associationName, subTree]) => {
    const association = model.associations[associationName];
    const childParentIdConfigs = associationToParentIdConfigs(association);
    return {
      ...memo,
      [associationName]: createExportPlanInner(association.target, subTree, childParentIdConfigs),
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

  return { model, associations, parentIdConfigs, columns };
};

export const executeExportPlan = async (plan, { since, limit = 100 }) => {
  const { model, parentIdConfigs } = plan;
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
  if (parentIdConfigs) {
    const parentIds = extractStaticParentIds(parentIdConfigs);
    options.where = {
      ...options.where,
      ...parentIds,
    };
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

const executeExportPlanInner = async (plan, options) => {
  const { model, associations, columns } = plan;

  // query records
  const dbRecords = await model.findAll(options);

  const syncRecords = [];
  for (const dbRecord of dbRecords) {
    const syncRecord = { data: {} };

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
        const parentIds = extractDynamicParentIds(associationPlan.parentIdConfigs, dbRecord);
        const associationOptions = { where: parentIds };
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
