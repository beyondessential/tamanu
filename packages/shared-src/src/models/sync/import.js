import { Sequelize, Op } from 'sequelize';
import { chunk, flatten, memoize, without, pick, pickBy } from 'lodash';
import { propertyPathsToTree } from './metadata';

// SQLite < v3.32 has a hard limit of 999 bound parameters per query
// see https://www.sqlite.org/limits.html for more
// All newer versions and Postgres limits are higher
const SQLITE_MAX_PARAMETERS = 999;
export const chunkRows = rows => {
  const maxColumnsPerRow = rows.reduce((max, r) => Math.max(Object.keys(r).length, max), 0);
  const rowsPerChunk = Math.floor(SQLITE_MAX_PARAMETERS / maxColumnsPerRow);
  return chunk(rows, rowsPerChunk);
};

export const createImportPlan = memoize(model => {
  const relationTree = propertyPathsToTree(model.includedSyncRelations);
  return createImportPlanInner(model, relationTree, model.syncParentIdKey);
});

const createImportPlanInner = (model, relationTree, foreignKey) => {
  // columns
  const allColumns = Object.keys(model.tableAttributes);
  const columns = without(allColumns, ...model.excludedSyncColumns);

  //relations
  const children = Object.entries(relationTree).reduce((memo, [relationName, childTree]) => {
    const association = model.associations[relationName];
    const childParentIdKey = association.foreignKey;
    const childModel = association.target;
    if (!childModel) {
      throw new Error(
        `createImportPlan: no such relation ${relationName} (defined in includedSyncRelations on ${model.name})`,
      );
    }
    const childPlan = createImportPlanInner(childModel, childTree, childParentIdKey);
    return { ...memo, [relationName]: childPlan };
  }, {});

  return { model, columns, children, foreignKey };
};

export const executeImportPlan = async (plan, channel, syncRecords) => {
  const { model } = plan;
  let parentId = null;
  if (plan.foreignKey) {
    parentId = model.syncParentIdFromChannel(channel);
    if (!parentId) {
      throw new Error(
        `Must provide parentId for models like ${model.name} with syncParentIdKey set`,
      );
    }
  }

  return model.sequelize.transaction(async () => {
    // split records into create, update, delete
    const idsForDelete = syncRecords.filter(r => r.isDeleted).map(r => r.data.id);
    const idsForUpsert = syncRecords.filter(r => !r.isDeleted && r.data.id).map(r => r.data.id);
    const existing = await model.findByIds(idsForUpsert);
    const existingIdSet = new Set(existing.map(e => e.id));
    const recordsForCreate = syncRecords
      .filter(r => !r.isDeleted && !existingIdSet.has(r.data.id))
      .map(r => r.data);
    const recordsForUpdate = syncRecords
      .filter(r => !r.isDeleted && existingIdSet.has(r.data.id))
      .map(r => r.data);

    // run each import process
    const createSuccessCount = await executeCreates(plan, recordsForCreate);
    const updateSuccessCount = await executeUpdates(plan, recordsForUpdate);
    const deleteSuccessCount = await executeDeletes(plan, idsForDelete);

    // return count of successes
    return createSuccessCount + updateSuccessCount + deleteSuccessCount;
  });
};

const executeDeletes = async (importPlan, idsForDelete) => {
  const { model } = importPlan;

  // delete tombstones if we're in client mode
  if (model.syncClientMode) {
    const deleteCount = await model.destroy({ where: { id: { [Op.in]: idsForDelete } } });
    return deleteCount;
  }

  // mark them deleted if we're in server mode
  // this case shouldn't be hit under normal use
  const [deleteCount] = await model.update(
    {
      deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
      updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        id: {
          [Op.in]: idsForDelete,
        },
      },
      paranoid: false,
    },
  );
  return deleteCount;
};

const executeCreates = async (importPlan, records) => {
  // ensure all records have ids
  const recordsWithIds = records.map(data => {
    if (data.id) return data;
    // if we're on the client, a missing ID is an error
    if (importPlan.syncClientMode) {
      throw new Error('executeImportPlan: record id was missing');
    }
    // on the server, we just generate one now, so we can easily pass correct parent ids during
    // bulk create of children later
    return { ...data, id: importPlan.model.generateId() };
  });
  return executeUpdateOrCreates(importPlan, recordsWithIds, model => async rows =>
    model.bulkCreate(rows),
  );
};

const executeUpdates = async (importPlan, records) =>
  executeUpdateOrCreates(importPlan, records, model => async rows => {
    await Promise.all(rows.map(async row => model.update(row, { where: { id: row.id } })));
    return rows;
  });

const executeUpdateOrCreates = async (
  { model, columns, children },
  records,
  buildUpdateOrCreateFn,
) => {
  if (records.length === 0) {
    return 0;
  }

  const updateOrCreateFn = buildUpdateOrCreateFn(model);

  const rows = records.map(data => {
    // use only allowed columns
    let values = pick(data, ...columns);
    values.pulledAt = new Date();

    // on the server, remove null or undefined fields
    if (!model.syncClientMode) {
      values = pickBy(values, value => value !== undefined && value !== null);
    }

    return values;
  });

  for (const batchOfRows of chunkRows(rows)) {
    await updateOrCreateFn(batchOfRows);
  }

  for (const [relationName, relationPlan] of Object.entries(children)) {
    const { foreignKey } = relationPlan;

    const childRecords = flatten(
      // eslint-disable-next-line no-loop-func
      records.map(data => {
        const childrenOfRecord = data[relationName];
        if (!childrenOfRecord) {
          return [];
        }

        return childrenOfRecord.map(child => ({
          ...child.data,
          [foreignKey]: data.id,
        }));
      }),
    );
    if (childRecords) {
      await executeUpdateOrCreates(relationPlan, childRecords, buildUpdateOrCreateFn);
    }
  }

  return records.length; // TODO return actual number of successful upserts
};
