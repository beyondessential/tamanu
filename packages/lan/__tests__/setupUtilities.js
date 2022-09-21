import { FAKE_UUID_PATTERN } from 'shared/utils/generateId';

export function deleteAllTestIds({ models, sequelize }) {
  const tableNames = Object.values(models).map(m => m.tableName);
  const deleteTasks = tableNames.map(table =>
    sequelize.query(`DELETE FROM ${table} WHERE id::text LIKE $1`, {
      bind: [FAKE_UUID_PATTERN],
    }),
  );
  return Promise.all(deleteTasks);
}
