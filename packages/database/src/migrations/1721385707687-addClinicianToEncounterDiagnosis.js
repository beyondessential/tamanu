import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('encounter_diagnoses', 'clinician_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('encounter_diagnoses', 'clinician_id');
}
