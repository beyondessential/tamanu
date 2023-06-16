import { STRING } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_additional_data', 'mother_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'patients',
      key: 'id',
    },
  });
  await query.addColumn('patient_additional_data', 'father_id', {
    type: STRING,
    allowNull: true,
    references: {
      model: 'patients',
      key: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('patient_additional_data', 'mother_id');
  await query.removeColumn('patient_additional_data', 'father_id');
}
