import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'dhis2_pushes', schema: 'logs' };

export async function up(query: QueryInterface) {
  await query.addColumn(TABLE, 'data_sets_completed', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  await query.addColumn(TABLE, 'data_set_completion_errors', {
    type: DataTypes.JSON,
    allowNull: true,
  });
}

export async function down(query: QueryInterface) {
  await query.removeColumn(TABLE, 'data_sets_completed');
  await query.removeColumn(TABLE, 'data_set_completion_errors');
}
