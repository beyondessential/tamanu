import { DataTypes } from 'sequelize';

const SELECTED_GRAPHED_VITALS_ON_FILTER_KEY = 'selectedGraphedVitalsOnFilter';

export async function up(query) {
  await query.addColumn('user_preferences', 'key', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addColumn('user_preferences', 'value', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE user_preferences
    SET key = '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}', value = (to_json(selected_graphed_vitals_on_filter::text)::jsonb)
    WHERE selected_graphed_vitals_on_filter IS NOT NULL;
  `);

  await query.removeColumn('user_preferences', 'selected_graphed_vitals_on_filter');

  await query.changeColumn('user_preferences', 'key', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  await query.changeColumn('user_preferences', 'value', {
    type: DataTypes.JSONB,
    allowNull: false,
  });
}

export async function down(query) {
  await query.addColumn('user_preferences', 'selected_graphed_vitals_on_filter', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE user_preferences
    SET selected_graphed_vitals_on_filter = value
    WHERE key = '${SELECTED_GRAPHED_VITALS_ON_FILTER_KEY}'
  `);

  await query.dropColumn('user_preferences', 'key');
  await query.dropColumn('user_preferences', 'value');
}
