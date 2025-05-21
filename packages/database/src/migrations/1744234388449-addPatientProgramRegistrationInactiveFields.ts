import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Step 1: Add new columns
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

  // TODO UNDO
  // Step 2: Update deactivation fields for inactive most recent registrations
  // await query.sequelize.query(`
  //   UPDATE patient_program_registrations current
  //   SET
  //     deactivated_date = current.date,
  //     deactivated_clinician_id = current.clinician_id
  //   WHERE
  //     registration_status = 'inactive'
  //     AND is_most_recent = TRUE;
  // `);

  // Step 3: Update date and clinician_id to earliest registration for inactive registrations
  // await query.sequelize.query(`
  //   WITH earliest_registrations AS (
  //     SELECT DISTINCT ON (patient_id, program_registry_id)
  //       id,
  //       date,
  //       clinician_id,
  //       patient_id,
  //       program_registry_id
  //     FROM patient_program_registrations
  //     ORDER BY
  //       patient_id,
  //       program_registry_id,
  //       date ASC
  //   )
  //   UPDATE patient_program_registrations current
  //   SET
  //     date = er.date,
  //     clinician_id = er.clinician_id
  //   FROM earliest_registrations er
  //   WHERE
  //     current.patient_id = er.patient_id
  //     AND current.program_registry_id = er.program_registry_id
  //     AND current.registration_status = 'inactive'
  //     AND is_most_recent = TRUE;
  // `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_program_registrations', 'deactivated_clinician_id');
  await query.removeColumn('patient_program_registrations', 'deactivated_date');
}
