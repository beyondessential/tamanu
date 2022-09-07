import { QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('survey_responses', 'user_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('survey_responses', 'user_id');
}
