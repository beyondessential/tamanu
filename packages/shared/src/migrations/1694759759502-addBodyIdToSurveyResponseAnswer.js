import { DataTypes } from 'sequelize';

const tableName = 'survey_response_answers';
const columnName = 'body_id';

export async function up(query) {
  await query.addColumn(tableName, columnName, {
    type: DataTypes.STRING,
  });
}

export async function down(query) {
  await query.removeColumn(tableName, columnName);
}
