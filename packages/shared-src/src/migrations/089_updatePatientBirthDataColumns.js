import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_birth_data', 'attendant_at_birth', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await query.addColumn('patient_birth_data', 'name_of_attendant_at_birth', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await query.addColumn('patient_birth_data', 'birth_facility_id', {
    type: Sequelize.STRING,
    references: {
      model: 'facilities',
      key: 'id',
    },
    allowNull: true,
  });
  await query.addColumn('patient_birth_data', 'registered_birth_place', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await query.removeColumn('patient_birth_data', 'clinician_at_birth_id');
}

export async function down(query) {
  await query.addColumn('patient_birth_data', 'clinician_at_birth_id', {
    type: Sequelize.STRING,
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: true,
  });
  await query.removeColumn('patient_birth_data', 'attendant_at_birth');
  await query.removeColumn('patient_birth_data', 'name_of_attendant_at_birth');
  await query.removeColumn('patient_birth_data', 'registered_birth_place');
}
