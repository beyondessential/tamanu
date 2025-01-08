import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('user_preferences', 'encounter_tab_orders', {
    type: DataTypes.JSONB,
    defaultValue: {},
  });
}

export async function down(query) {
  await query.removeColumn('user_preferences', 'encounter_tab_orders');
}
