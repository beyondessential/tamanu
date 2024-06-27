import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('user_preferences', 'preference_key', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await query.addColumn('user_preferences', 'preference_value', {
    type: DataTypes.JSONB,
    allowNull: false,
  });
}

export async function down(query) {
  await query.dropColumn('user_preferences', 'preference_key');
  await query.dropColumn('user_preferences', 'preference_value');
}
