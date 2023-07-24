import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('settings', 'default_value', {
    type: DataTypes.JSONB,
  });
}

export async function down(query) {
  await query.removeColumn('settings', 'default_value');
}
