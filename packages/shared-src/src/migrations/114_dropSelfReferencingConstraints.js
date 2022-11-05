export async function up(query) {
  await query.removeConstraint('patients', 'patients_merged_into_id_fkey');
  await query.removeConstraint(
    'patient_additional_data',
    'patient_additional_data_merged_into_id_fkey',
  );
}

export async function down(query) {
  await query.addConstraint('patients', {
    type: 'foreign key',
    name: 'patients_merged_into_id_fkey',
    fields: ['merged_into_id'],
    references: {
      table: 'patients',
      field: 'id',
    },
  });
  await query.addConstraint('patient_additional_data', {
    type: 'foreign key',
    name: 'patient_additional_data_merged_into_id_fkey',
    fields: ['merged_into_id'],
    references: {
      table: 'patient_additional_data',
      field: 'id',
    },
  });
}
