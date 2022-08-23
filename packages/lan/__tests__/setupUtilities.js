export function deleteAllTestIds({ models, sequelize }) {
  const tableNames = Object.values(models).map(m => m.tableName);
  const deleteTasks = tableNames.map(x =>
    sequelize.query(`
    DELETE FROM ${x} WHERE id LIKE 'test-%';
  `),
  );
  return Promise.all(deleteTasks);
}

export async function createCustomTypes({ sequelize }) {
  await sequelize.query(`CREATE DOMAIN date_time_string as CHAR(19)`);
  await sequelize.query(`CREATE DOMAIN date_string as CHAR(10)`);
}
