import { Op, Sequelize } from 'sequelize';
import { FHIR_INTERACTIONS } from 'shared/constants/fhir';
import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';
import { FAKE_UUID_PATTERN } from 'shared/utils/generateId';

export function deleteAllTestIds({ models }) {
  const sortedModels = sortInDependencyOrder(models).reverse();
  const existingInDb = sortedModels.filter(
    model => !model.CAN_DO || model.CAN_DO?.has(FHIR_INTERACTIONS.INTERNAL.MATERIALISE),
  );
  const deleteTasks = existingInDb.map(Model =>
    Model.destroy({
      force: true,
      where: Sequelize.where(Sequelize.cast(Sequelize.col('id'), 'text'), {
        [Op.like]: FAKE_UUID_PATTERN,
      }),
    }),
  );
  return Promise.all(deleteTasks);
}
