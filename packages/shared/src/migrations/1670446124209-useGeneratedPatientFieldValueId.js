import Sequelize from 'sequelize';

export async function up(query) {
  await query.sequelize.query(
    `
    ALTER TABLE patient_field_values DROP CONSTRAINT patient_field_values_pkey;
    ALTER TABLE patient_field_values ADD PRIMARY KEY (patient_id, definition_id);
  `,
  );
  await query.removeColumn('patient_field_values', 'id');
  await query.addColumn('patient_field_values', 'id', {
    type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("definition_id", ';', ':')) STORED`,
  });
}

export async function down(query) {
  await query.removeColumn('patient_field_values', 'id');
  await query.addColumn('patient_field_values', 'id', {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: Sequelize.fn('uuid_generate_v4'),
  });
  await query.sequelize.query(`
    ALTER TABLE patient_field_values DROP CONSTRAINT patient_field_values_pkey;
    ALTER TABLE patient_field_values ADD PRIMARY KEY (id);
  `);
}
