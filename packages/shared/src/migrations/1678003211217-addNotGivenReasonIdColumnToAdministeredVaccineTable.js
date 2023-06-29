import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'not_given_reason_id', {
    type: DataTypes.STRING,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'not_given_reason_id');
}
