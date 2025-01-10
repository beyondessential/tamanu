import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.changeColumn('survey_screen_components', 'validation_criteria', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

/*
  Data loss after the 256th character.
  Given it's reference data it's not really an issue,
  will need to re-import all surveys.
*/
export async function down(query) {
  await query.changeColumn('survey_screen_components', 'validation_criteria', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
