import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Add indexes for medication_administration_records table
  // Composite index for the main query conditions: prescription_id, due_at, status, deleted_at
  await query.addIndex(
    'medication_administration_records',
    ['prescription_id', 'due_at', 'status'],
    {
      name: 'idx_mar_prescription_due_status',
      where: { deleted_at: null },
    },
  );

  await query.addIndex('encounter_prescriptions', ['prescription_id', 'encounter_id'], {
    name: 'idx_ep_prescription_encounter',
  });

  await query.addIndex(
    'encounter_pause_prescriptions',
    ['encounter_prescription_id', 'pause_start_date', 'pause_end_date'],
    {
      name: 'idx_epp_encounter_prescription_dates',
      where: { deleted_at: null },
    },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  // Drop indexes in reverse order
  await query.removeIndex('encounter_pause_prescriptions', 'idx_epp_encounter_prescription_dates');
  await query.removeIndex('encounter_prescriptions', 'idx_ep_prescription_encounter');
  await query.removeIndex('medication_administration_records', 'idx_mar_prescription_due_status');
}
