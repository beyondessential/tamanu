import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('survey_responses', 'user_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('survey_responses', 'user_id');
}
