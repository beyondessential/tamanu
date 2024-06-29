/* eslint-disable no-unused-vars */
// remove the above line

import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.sequelize.query(`
    UPDATE user_preferences
    SET preference_value = selected_graphed_vitals_on_filter::jsonb
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
}
