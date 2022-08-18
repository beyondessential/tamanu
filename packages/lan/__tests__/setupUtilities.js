import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';

export function deleteAllTestIds({ models, sequelize }) {
  const sortedModels = sortInDependencyOrder(models).reverse();
  const tableNames = sortedModels.map(m => m.tableName);
  const deleteTasks = tableNames.map(x =>
    sequelize.query(`
    DELETE FROM ${x} WHERE id LIKE 'test-%';
  `),
  );
  return Promise.all(deleteTasks);
}
