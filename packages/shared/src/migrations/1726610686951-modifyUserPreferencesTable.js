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

  await query.sequelize.query(`
    UPDATE user_preferences
    SET preference_value = (to_json(selected_graphed_vitals_on_filter::text)::jsonb)
    WHERE selected_graphed_vitals_on_filter IS NOT NULL;
  `);

  await query.sequelize.query(`
    ALTER TABLE user_preferences 
    DROP COLUMN selected_graphed_vitals_on_filter;
  `);
}

export async function down(query) {
  await query.addColumn('user_preferences', 'selected_graphed_vitals_on_filter', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.sequelize.query(`
    UPDATE user_preferences
    SET selected_graphed_vitals_on_filter = preference_value
    WHERE key = 'selectedGraphedVitalsOnFilter'
  `);

  await query.dropColumn('user_preferences', 'preference_key');
  await query.dropColumn('user_preferences', 'preference_value');
}
