import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('survey_screen_components', 'visibility_status', {
    type: Sequelize.STRING,
    defaultValue: null,
  });
}

export async function down(query) {
  await query.removeColumn('survey_screen_components', 'visibility_status');
}
