import Sequelize, { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE patient_additional_data ADD PRIMARY KEY (patient_id);
  `);
  await query.removeColumn('patient_additional_data', 'id');
  await query.addColumn('patient_additional_data', 'id', {
    type: `TEXT GENERATED ALWAYS AS ("patient_id") STORED`,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_additional_data', 'id');
  await query.addColumn('patient_additional_data', 'id', {
    type: Sequelize.UUID,
    allowNull: false,
    defaultValue: Sequelize.UUIDV4,
  });
  await query.sequelize.query(`
    ALTER TABLE patient_additional_data ADD PRIMARY KEY (id);
  `);
}
