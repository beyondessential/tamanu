import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('survey_responses', 'metadata', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('survey_responses', 'metadata');
}
