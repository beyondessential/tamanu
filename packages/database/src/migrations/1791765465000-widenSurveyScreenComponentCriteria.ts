import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('survey_screen_components', 'visibility_criteria', {
    type: DataTypes.TEXT,
  });
  await query.changeColumn('survey_screen_components', 'calculation', {
    type: DataTypes.TEXT,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn('survey_screen_components', 'visibility_criteria', {
    type: DataTypes.STRING,
  });
  await query.changeColumn('survey_screen_components', 'calculation', {
    type: DataTypes.STRING,
  });
}
