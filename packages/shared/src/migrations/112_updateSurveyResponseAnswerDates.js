import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('survey_response_answers', 'body_legacy', {
    type: DataTypes.TEXT,
  });
  // Dates are migrated correctly in follow up migration 113
}

export async function down(query) {
  await query.removeColumn('survey_response_answers', 'body_legacy');
}
