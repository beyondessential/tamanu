import Sequelize, { QueryInterface, Op } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.bulkDelete('patient_additional_data', { merged_into_id: { [Op.not]: null } }); // this bit destructive, can't be downed
  await query.removeColumn('patient_additional_data', 'merged_into_id');
  await query.sequelize.query(`
    ALTER TABLE patient_additional_data DROP CONSTRAINT patient_additional_data_pkey;
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
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: Sequelize.UUIDV4,
  });
  await query.sequelize.query(`
    ALTER TABLE patient_additional_data DROP CONSTRAINT patient_additional_data_pkey;
    ALTER TABLE patient_additional_data ADD PRIMARY KEY (id);
  `);
  try {
    await query.addColumn('patient_additional_data', 'merged_into_id', {
      type: Sequelize.TEXT,
      allowNull: true,
      references: { model: 'patient_additional_data', key: 'id' },
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
}
