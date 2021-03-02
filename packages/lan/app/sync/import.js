import { memoize } from 'lodash';

// TODO: will eventually filter fields and recurse over nested relationships
export const createImportPlan = memoize(model => {
  return { model };
});

export const executeImportPlan = async ({ model }, { isDeleted, data }) => {
  const { id } = data;
  if (!id) {
    throw new Error('executeImportPlan: record id was missing');
  }

  if (isDeleted) {
    const record = await model.findByPk(id);
    await record?.destroy();
    return;
  }

  // sequelize upserts don't work because they insert before update - hack to work around this
  // this could cause a race condition if anything but SyncManager does it, or if two syncs run at once!
  // see also: https://github.com/sequelize/sequelize/issues/5711
  const [numUpdated] = await model.update(data, { where: { id } });
  if (numUpdated === 0) {
    await model.create(data);
  }
};
