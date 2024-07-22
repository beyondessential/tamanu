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
  await query.addConstraint('encounter_diagnoses', {
    type: 'foreign key',
    name: 'encounter_diagnoses_registering_clinician_id_fkey',
    fields: ['clinician_id'],
    references: {
      table: 'users',
      field: 'id',
    },
  });
}

export async function down(query) {
  await query.removeConstraint(
    'encounter_diagnoses',
    'encounter_diagnoses_registering_clinician_id_fkey',
  );
  await query.removeColumn('encounter_diagnoses', 'clinician_id');
}
