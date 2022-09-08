import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';

export function deleteAllTestIds({ models, sequelize }) {
  const sortedModels = sortInDependencyOrder(models).reverse();
  const tableNames = sortedModels.map(m => m.tableName);
  const deleteTasks = tableNames.map(x =>
    sequelize.query(`
    DELETE FROM ${x} WHERE id::text LIKE 'abcd%';  -- automatically generated test ids use this pattern
    DELETE FROM ${x} WHERE id::text LIKE 'test-%'; -- some manually constructed test data uses this pattern
  `),
  );
  return Promise.all(deleteTasks);
}
