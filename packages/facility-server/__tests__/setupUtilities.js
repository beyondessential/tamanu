import { Op, Sequelize } from 'sequelize';
import { FHIR_INTERACTIONS } from '@tamanu/constants/fhir';
import { SYSTEM_USER_UUID } from '@tamanu/constants/auth';
import { sortInDependencyOrder } from '@tamanu/database';
import { FAKE_UUID_PATTERN } from '@tamanu/utils/generateId';

export function deleteAllTestIds({ models }) {
  const sortedModels = sortInDependencyOrder(models).reverse();
  const existingInDb = sortedModels.filter(
    (model) => !model.CAN_DO || model.CAN_DO?.has(FHIR_INTERACTIONS.INTERNAL.MATERIALISE),
  );
  const deleteTasks = existingInDb.map((Model) => {
    const where = [
      Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'text'), {
        [Op.like]: FAKE_UUID_PATTERN,
      }),
    ]
    if (Model.name === 'User') {
      where.push({
        id: {
          [Op.not]: SYSTEM_USER_UUID
        },
      });
    }
    return Model.destroy({
      force: true,
      where: {
        [Op.and]: where,
      },
    });
  });
  return Promise.all(deleteTasks);
}
