import Sequelize from 'sequelize';

export async function up(query) {
  await query.sequelize.query(
    `
    ALTER TABLE patient_birth_data DROP CONSTRAINT patient_birth_data_pkey;
    ALTER TABLE patient_birth_data ADD PRIMARY KEY (patient_id);
  `,
  );
  await query.removeColumn('patient_birth_data', 'id');
  await query.addColumn('patient_birth_data', 'id', {
    type: `TEXT GENERATED ALWAYS AS ("patient_id") STORED`,
  });
}

export async function down(query) {
  await query.removeColumn('patient_birth_data', 'id');

  // Previously, patient_birth_data was using defaultValue: Sequelize.UUIDV4 which doesn't actually generate UUID for default values (ie: equivalent to default: null)
  // We still want to bring the schema back to the original state here, but for environment that already has PatientBirthData,
  // allowNull: false + defaultValue: Sequelize.UUIDV4/null will not work as id column has a non-null constraint
  // So what we want to do here is use defaultValue: uuid_generate_v4 first and then drop the defaultValue to work around.
  await query.addColumn('patient_birth_data', 'id', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'), // using uuid_generate_v4 here
  });
  await query.changeColumn('patient_birth_data', 'id', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: null,
  });

  await query.sequelize.query(`
    ALTER TABLE patient_birth_data DROP CONSTRAINT patient_birth_data_pkey;
    ALTER TABLE patient_birth_data ADD PRIMARY KEY (id);
  `);
}
