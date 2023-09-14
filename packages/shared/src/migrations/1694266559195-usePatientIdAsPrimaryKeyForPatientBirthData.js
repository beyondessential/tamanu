import Sequelize, { DataTypes } from 'sequelize';

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
  await query.addColumn('patient_birth_data', 'id', {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });
  await query.sequelize.query(`
    ALTER TABLE patient_birth_data DROP CONSTRAINT patient_birth_data_pkey;
    ALTER TABLE patient_birth_data ADD PRIMARY KEY (id);
  `);
}
