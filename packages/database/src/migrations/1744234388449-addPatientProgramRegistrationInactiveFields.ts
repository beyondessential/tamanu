import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_program_registrations', 'deactivated_clinician_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  await query.addColumn('patient_program_registrations', 'deactivated_date', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  // Populate the deactivated_date field for existing inactive registrations
  // We're leaving deactivated_clinician_id as NULL since we don't have information
  // about which clinician deactivated these records
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET deactivated_date = NOW()
    WHERE registration_status = 'inactive' AND deactivated_date IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_program_registrations', 'deactivated_clinician_id');
  await query.removeColumn('patient_program_registrations', 'deactivated_date');
}
