import { Op } from 'sequelize';
import { memoize } from 'lodash';
import { propertyPathsToTree } from './metadata';

// TODO: nested model support
export const createExportPlan = memoize(model => {
  const relationTree = propertyPathsToTree(model.includedSyncRelations);
  const include = includeFromTree(relationTree);
  return { model, include, relationTree };
});

export const includeFromTree = relationTree =>
  Object.entries(relationTree).map(([association, children]) => {
    const include = includeFromTree(children);
    if (include.length > 0) {
      return { association, include };
    }
    return { association };
  });

export const executeExportPlan = async ({ model, include }, { after, limit = 100 }) => {
  const options = {
    where: {
      markedForPush: true,
    },
    limit,
    order: [['id', 'ASC']],
  };
  if (after) {
    options.where.id = { [Op.gt]: after.data.id };
  }
  if (include) {
    options.include = include;
  }
  const dbRecords = await model.findAll(options);
  console.log(dbRecords[0]?.administeredVaccines);

  return dbRecords.map(record => ({ data: record.dataValues }));
};
