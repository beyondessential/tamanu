import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('administered_vaccines', 'supervising_clinician_id', {
    type: DataTypes.STRING,
    references: {
      model: 'users',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('administered_vaccines', 'supervising_clinician_id');
}
