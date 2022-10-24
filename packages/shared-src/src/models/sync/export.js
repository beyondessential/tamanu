import { Op, DataTypes } from 'sequelize';
import { without } from 'lodash';
import config from 'config';
import { propertyPathsToTree } from './metadata';
import { getSyncCursorFromRecord, syncCursorToWhereCondition } from './cursor';
import { toDateTimeString, toDateString } from '../../utils/dateTime';

export const createExportPlan = (sequelize, channel) =>
  sequelize.channelRouter(channel, (model, params, channelRoute) => {
    const relationTree = propertyPathsToTree(model.syncConfig.includedRelations);
    const { where, include } = channelRoute.queryFromParams(params);
    return createExportPlanInner(model, relationTree, { where, include });
  });

const createExportPlanInner = (model, relationTree, query) => {
  // generate nested association exporters
  const associations = Object.entries(relationTree).reduce((memo, [associationName, subTree]) => {
    const association = model.associations[associationName];
    const { foreignKey } = association;
    return {
      ...memo,
      [associationName]: createExportPlanInner(association.target, subTree, { foreignKey }),
    };
  }, {});

  // generate formatters for columns
  const allColumnNames = Object.keys(model.tableAttributes);
  const columns = without(allColumnNames, ...model.syncConfig.excludedColumns).reduce(
    (memo, columnName) => {
      const columnType = model.tableAttributes[columnName].type;
      let formatter = null; // default to passing the value straight through
      if (columnType instanceof DataTypes.DATE) {
        formatter = date => date?.toISOString();
      } else if (columnType instanceof DataTypes.DATETIMESTRING) {
        formatter = date => toDateTimeString(date) ?? undefined;
      } else if (columnType instanceof DataTypes.DATESTRING) {
        formatter = date => toDateString(date) ?? undefined;
      }
      return { ...memo, [columnName]: formatter };
    },
    {},
  );

  return { model, associations, columns, query };
};

export const executeExportPlan = async (plan, { since, until, limit = 100 }) => {
  const { syncClientMode } = plan.model;

  // add clauses to where query
  const whereClauses = [];
  if (plan.query.where) {
    whereClauses.push(plan.query.where);
  }
  if (syncClientMode) {
    // only push marked records in server mode
    whereClauses.push({
      // records that were marked by the client (e.g. SyncManager)
      // done to avoid a race condition when setting markedForPush
      isPushing: true,
    });
  }
  if (since) {
    whereClauses.push(syncCursorToWhereCondition(since));
  }
  if (config?.sync?.allowUntil && until && typeof until === 'number') {
    whereClauses.push({
      // eslint-disable-next-line custom-date-rules/no-date-constructor-with-param
      updatedAt: { [Op.lt]: new Date(until) },
    });
  }

  // build options
  const options = {
    order: [
      // order by clause must remain consistent for the sync cursor to work - don't change!
      ['updated_at', 'ASC'],
      ['id', 'ASC'],
    ],
    where: {
      [Op.and]: whereClauses,
    },
    include: plan.query.include,
  };
  if (!syncClientMode) {
    // load deleted records in server mode
    options.paranoid = false;
  }
  if (limit) {
    options.limit = limit;
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
        const { foreignKey } = associationPlan.query;
        if (!foreignKey) {
          throw new Error(`executeExportPlanInner: missing foreign key for ${associationName}`);
        }
        const associationOptions = {
          where: {
            [foreignKey]: dbRecord.id,
          },
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
