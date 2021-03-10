import { memoize, without, pick } from 'lodash';
import { propertyPathsToTree } from './metadata';

export const createImportPlan = memoize((model, channel) => {
  const relationTree = propertyPathsToTree(model.includedSyncRelations);
  const parentIdConf =
    model.getParentIdConfigFromChannel && model.getParentIdConfigFromChannel(channel);
  return createImportPlanInner(model, relationTree, parentIdConf);
});

const createImportPlanInner = (model, relationTree, parentIdConf = {}) => {
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
    const childPlan = createImportPlanInner(childModel, childTree, { key: childParentIdKey });
    return { ...memo, [relationName]: childPlan };
  }, {});

  return { model, columns, children, parentIdConf };
};

export const executeImportPlan = async (plan, syncRecord) =>
  plan.model.sequelize.transaction(async () => executeImportPlanInner(plan, syncRecord));

const executeImportPlanInner = async (
  { model, columns, children, parentIdConf },
  syncRecord,
  parentId = null,
) => {
  const { data, isDeleted } = syncRecord;
  const { id } = data;
  if (!id) {
    throw new Error('executeImportPlan: record id was missing');
  }

  if (isDeleted) {
    const record = await model.findByPk(id);
    await record?.destroy();
    return;
  }

  // use only allowed columns
  const values = pick(data, ...columns);
  if (parentIdConf.key) {
    values[parentIdConf.key] = parentIdConf.overrideId || parentId || null;
  }

  // sequelize upserts don't work because they insert before update - hack to work around this
  // this could cause a race condition if anything but SyncManager does it, or if two syncs run at once!
  // see also: https://github.com/sequelize/sequelize/issues/5711
  const [numUpdated] = await model.update(values, { where: { id } });
  if (numUpdated === 0) {
    await model.create(values);
  }

  for (const [relationName, plan] of Object.entries(children)) {
    for (const childRecord of data[relationName]) {
      await executeImportPlanInner(plan, childRecord, id);
    }
  }
};
