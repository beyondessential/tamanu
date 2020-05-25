
export function deleteAllTestIds({ models, sequelize }) {
  console.log('Deleting all test records from database...');
  const tableNames = Object.values(models).map(m => m.tableName);
  const deleteTasks = tableNames.map(x =>
    sequelize.query(`
    DELETE FROM ${x} WHERE id LIKE 'test-%';
  `),
  );
  return Promise.all(deleteTasks);
}
