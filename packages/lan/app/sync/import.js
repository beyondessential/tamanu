import { memoize, without, pick } from 'lodash';
import { log } from '~/logging';
import { propertyPathsToTree } from './metadata';

export const createImportPlan = memoize(model => {
  const relationTree = propertyPathsToTree(model.includedSyncRelations || []);
  return createImportPlanInner(model, relationTree);
});

const createImportPlanInner = (model, relationTree, parentIdKey = null) => {
  // columns
  const allColumns = Object.keys(model.tableAttributes);
  const columns = without(allColumns, model.excludedSyncColumns);

  //relations
  const children = Object.entries(relationTree).reduce((memo, [relationName, childTree]) => {
    const association = model.associations[relationName];
    const childParentIdKey = association.foreignKey;
    const childModel = association.target;
    if (!childModel) {
      log.warn(
        `createImportPlan: no such relation ${relationName} (defined in includedSyncRelations on ${model.name})`,
      );
      return memo;
    }
    const childPlan = createImportPlanInner(childModel, childTree, childParentIdKey);
    return { ...memo, [relationName]: childPlan };
  }, {});

  return { model, columns, children, parentIdKey };
};

export const executeImportPlan = async (plan, syncRecord) =>
  plan.model.sequelize.transaction(async t => executeImportPlanInner(plan, syncRecord, t));

const executeImportPlanInner = async (
  { model, columns, children, parentIdKey },
  syncRecord,
  transaction,
  parentId = null,
) => {
  const { data, isDeleted } = syncRecord;
  const { id } = data;
  if (!id) {
    throw new Error('executeImportPlan: record id was missing');
  }

  if (isDeleted) {
    const record = await model.findByPk(id, { transaction });
    await record?.destroy({ transaction });
    return;
  }

  // use only allowed columns
  const values = pick(data, ...columns);
  if (parentIdKey) {
    values[parentIdKey] = parentId;
  }

  // sequelize upserts don't work because they insert before update - hack to work around this
  // this could cause a race condition if anything but SyncManager does it, or if two syncs run at once!
  // see also: https://github.com/sequelize/sequelize/issues/5711
  const [numUpdated] = await model.update(values, { where: { id }, transaction });
  if (numUpdated === 0) {
    await model.actuallyCreate(values, { transaction });
  }

  for (const [relationName, plan] of Object.entries(children)) {
    for (const childRecord of data[relationName]) {
      await executeImportPlanInner(plan, childRecord, transaction, id);
    }
  }
};
