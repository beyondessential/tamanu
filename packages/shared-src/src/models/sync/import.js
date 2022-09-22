import { Sequelize, Op } from 'sequelize';
import { chunk, flatten, without, pick, pickBy } from 'lodash';
import { log } from 'shared/services/logging';
import { propertyPathsToTree } from './metadata';

// Postgres has a hard limit of 65535 bound parameters per query
//
// > Int16
// > The number of parameter format codes that follow
// -- https://www.postgresql.org/docs/13/protocol-message-formats.html
//
// There are ways to burst that limit, see:
// https://klotzandrew.com/blog/postgres-passing-65535-parameter-limit
const MAX_PARAMETERS = 65535;
export const chunkRows = rows => {
  const maxColumnsPerRow = rows.reduce((max, r) => Math.max(Object.keys(r).length, max), 0);
  const rowsPerChunk = Math.floor(MAX_PARAMETERS / maxColumnsPerRow);
  return chunk(rows, rowsPerChunk);
};

export const createImportPlan = (sequelize, channel) =>
  sequelize.channelRouter(channel, (model, params, channelRoute) => {
    const relationTree = propertyPathsToTree(model.syncConfig.includedRelations);
    const validateRecord = record => channelRoute.validateRecordParams(record, params);
    return createImportPlanInner(model, relationTree, validateRecord);
  });

const createImportPlanInner = (model, relationTree, validateRecord) => {
  // columns
  const allColumns = Object.keys(model.tableAttributes);
  const columns = without(allColumns, ...model.syncConfig.excludedColumns);

  // relations
  const children = Object.entries(relationTree).reduce((memo, [relationName, childTree]) => {
    const association = model.associations[relationName];
    const { through, target } = association;
    const childModel = through ? through.model : target;
    if (!childModel) {
      throw new Error(
        `createImportPlan: no such relation ${relationName} (defined in includedRelations on ${model.name}.syncConfig)`,
      );
    }
    const validateChild = (record, parentRecord) => {
      if (record[association.foreignKey] !== parentRecord.id) {
        throw new Error(
          `import: validateChild: child ${childModel.name}<${record.id}> didn't match ${model.name}<${parentRecord.id}>`,
        );
      }
    };
    const childPlan = createImportPlanInner(childModel, childTree, validateChild);
    return { ...memo, [relationName]: childPlan };
  }, {});

  return { model, columns, children, validateRecord };
};

export const executeImportPlan = async (plan, syncRecords) => {
  const { model, validateRecord } = plan;

  return model.sequelize.transaction(async () => {
    // split records into create, update, delete
    const idsForDelete = syncRecords.filter(r => r.isDeleted).map(r => r.data.id);
    const idsForUpsert = syncRecords.filter(r => !r.isDeleted && r.data.id).map(r => r.data.id);
    const existing = await model.findByIds(idsForUpsert, false);
    const existingIdSet = new Set(existing.map(e => e.id));
    const recordsForCreate = syncRecords
      .filter(r => !r.isDeleted && !existingIdSet.has(r.data.id))
      .map(({ data }) => {
        validateRecord(data, null);
        return data;
      });
    const recordsForUpdate = syncRecords
      .filter(r => !r.isDeleted && existingIdSet.has(r.data.id))
      .map(({ data }) => {
        validateRecord(data, null);
        return data;
      });

    const deletedUpdates = existing.filter(e => e.deletedAt);
    if (deletedUpdates.length > 0) {
      if (model.syncConfig.undeleteOnUpdate) {
        // restore the deleted records
        const idsToRestore = deletedUpdates.map(e => e.id);
        await model.update(
          {
            deletedAt: null,
          },
          {
            where: {
              id: {
                [Op.in]: idsToRestore,
              },
            },
          },
        );
      } else {
        log.error('Sync includes updates to deleted records', {
          ids: deletedUpdates.map(r => r.id),
        });
        throw new Error('Sync payload includes updates to deleted records');
      }
    }

    // run each import process
    const createSuccessCount = await executeCreates(plan, recordsForCreate);
    const updateSuccessCount = await executeUpdates(plan, recordsForUpdate);
    const deleteSuccessCount = await executeDeletes(plan, idsForDelete);

    // return count of successes
    return createSuccessCount + updateSuccessCount + deleteSuccessCount;
  });
};

const executeDeletes = async (importPlan, idsForDelete) => {
  if (idsForDelete.length === 0) return 0;

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

    // set flags so that changes don't get immediately marked for push back to the server
    values.pulledAt = new Date();
    values.markedForPush = false;

    // on the server, remove null or undefined fields, and run any other model-specific
    // santization (e.g. auto-closing outpatient encounters)
    if (!model.syncClientMode) {
      values = pickBy(values, value => value !== undefined && value !== null);
      values = model.sanitizeForSyncServer ? model.sanitizeForSyncServer(values) : values;
    } else {
      values = model.sanitizeForSyncClient ? model.sanitizeForSyncClient(values) : values;
    }

    return values;
  });

  for (const batchOfRows of chunkRows(rows)) {
    await updateOrCreateFn(batchOfRows);
  }

  for (const [relationName, relationPlan] of Object.entries(children)) {
    const childRecords = flatten(
      // eslint-disable-next-line no-loop-func
      records.map(data => {
        const childrenOfRecord = data[relationName];
        if (!childrenOfRecord) {
          return [];
        }
        return childrenOfRecord.map(({ data: childData }) => {
          relationPlan.validateRecord(childData, data);
          return childData;
        });
      }),
    );
    if (childRecords && childRecords.length > 0) {
      const existing = await relationPlan.model.findByIds(
        childRecords.map(r => r.id),
        false,
      );
      const existingIdSet = new Set(existing.map(e => e.id));
      const recordsForCreate = childRecords.filter(r => !existingIdSet.has(r.id));
      const recordsForUpdate = childRecords.filter(r => existingIdSet.has(r.id));
      await executeCreates(relationPlan, recordsForCreate);
      await executeUpdates(relationPlan, recordsForUpdate);
    }
  }

  return records.length; // TODO return actual number of successful upserts
};
