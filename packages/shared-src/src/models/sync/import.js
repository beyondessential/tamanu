import { memoize, without, pick } from 'lodash';
import { propertyPathsToTree } from './metadata';

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

export const executeImportPlan = async (plan, channel, syncRecord) => {
  let parentId = null;
  if (plan.foreignKey) {
    parentId = plan.model.syncParentIdFromChannel(channel);
    if (!parentId) {
      throw new Error('Must provide parentId for models like ${plan.model.name} with syncParentIdKey set');
    }
  }
  return plan.model.sequelize.transaction(async () => executeImportPlanInner(plan, syncRecord, parentId))
};

const executeImportPlanInner = async (
  { model, columns, children, foreignKey },
  syncRecord,
  parentId = null,
) => {
  const { data, isDeleted } = syncRecord;
  let { id } = data;
  // if we're on the client, a missing ID is an error
  // on the server, we just generate one - continue on
  if (model.syncClientMode && !id) {
    throw new Error('executeImportPlan: record id was missing');
  }

  if (isDeleted) {
    if (model.syncClientMode) {
      // delete tombstones if we're in client mode
      const record = await model.findByPk(id);
      await record?.destroy();
    } else {
      // mark them deleted if we're in server mode
      // this case shouldn't be hit under normal use
      await model.update(
        {
          deletedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
          updatedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        {
          where: { id },
          paranoid: false,
        },
      );
    }
    return;
  }

  // use only allowed columns
  const values = pick(data, ...columns);
  if (foreignKey) {
    values[foreignKey] = parentId || null;
  }

  // sequelize upserts don't work because they insert before update - hack to work around this
  // this could cause a race condition if anything but SyncManager does it, or if two syncs run at once!
  // see also: https://github.com/sequelize/sequelize/issues/5711
  let numUpdated = 0;
  if (id) {
    // only try updating a model we have an id for - otherwise, it's definitely an insert
    numUpdated = (await model.update(values, { where: { id } }))[0];
  }
  if (numUpdated === 0) {
    const createdRecord = await model.create(values);
    id = createdRecord.id;
  }

  for (const [relationName, plan] of Object.entries(children)) {
    if (data[relationName]) {
      for (const childRecord of data[relationName]) {
        await executeImportPlanInner(plan, childRecord, id);
      }
    }
  }
};
