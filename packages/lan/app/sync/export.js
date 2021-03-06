import { Op } from 'sequelize';
import { memoize } from 'lodash';

// TODO: nested model support
export const createExportPlan = memoize(model => ({ model }));

export const executeExportPlan = async ({ model }, { after, limit = 100 }) => {
  const where = {
    markedForPush: true,
  };
  if (after) {
    where.id = { [Op.gt]: after.data.id };
  }

  const dbRecords = await model.findAll({
    where,
    limit,
    order: [['id', 'ASC']],
  });

  return dbRecords.map(record => ({ data: record.dataValues }));
};
