import { Op, Sequelize } from 'sequelize';
import { FAKE_UUID_PATTERN } from 'shared/utils/generateId';

export function deleteAllTestIds({ models }) {
  const deleteTasks = Object.values(models).map(Model =>
    Model.destroy({
      force: true,
      where: Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'text'), {
        [Op.like]: FAKE_UUID_PATTERN,
      }),
    }),
  );
  return Promise.all(deleteTasks);
}
