import { memoize } from 'lodash';

// TODO: will eventually filter fields and recurse over nested relationships
export const createImportPlan = memoize(model => {
  return { model };
});

export const executeImportPlan = async ({ model }, { data }) => {
  const { id } = data;
  if (!id) {
    throw new Error('executeImportPlan: record id was missing');
  }

  // sequelize upserts don't work because they insert before update - hack to work around this
  // this could cause a race condition if anything but SyncManager does it, or if two syncs run at once!
  const [numUpdated] = await model.update(data, { where: { id } });
  if (numUpdated === 0) {
    await model.create(data);
  }
};
