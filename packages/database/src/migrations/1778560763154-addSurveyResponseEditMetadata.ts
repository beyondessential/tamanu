import { DataTypes, type QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('survey_responses', 'edited_time', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
  await query.addColumn('survey_response_answers', 'edited_time', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('survey_response_answers', 'edited_time');
  await query.removeColumn('survey_responses', 'edited_time');
}
