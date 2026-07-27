import { QueryInterface } from 'sequelize';

// Backfill the dispensed-detail columns on historical medication_dispenses from the prescription
// each dispense was made against (via its pharmacy_order_prescription). Historical dispenses were
// all dispensed as prescribed, so modified_* columns stay null.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE medication_dispenses md
    SET
      medication_id = p.medication_id,
      is_variable_dose = p.is_variable_dose,
      dose_amount = p.dose_amount,
      dosing_unit = p.dosing_unit,
      dispensing_unit = p.dispensing_unit,
      frequency = p.frequency,
      route = p.route,
      duration_value = p.duration_value,
      duration_unit = p.duration_unit,
      pharmacy_notes = p.pharmacy_notes,
      display_pharmacy_notes_in_mar = p.display_pharmacy_notes_in_mar
    FROM pharmacy_order_prescriptions pop
    JOIN prescriptions p ON p.id = pop.prescription_id
    WHERE md.pharmacy_order_prescription_id = pop.id
      AND md.medication_id IS NULL
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: clears the backfilled dispensed details; any values that legitimately differed
  // from the prescription (none are expected before this feature) would not be restored.
  await query.sequelize.query(`
    UPDATE medication_dispenses
    SET
      medication_id = NULL,
      is_variable_dose = NULL,
      dose_amount = NULL,
      dosing_unit = NULL,
      dispensing_unit = NULL,
      frequency = NULL,
      route = NULL,
      duration_value = NULL,
      duration_unit = NULL,
      pharmacy_notes = NULL,
      display_pharmacy_notes_in_mar = NULL
    WHERE modified_at IS NULL
  `);
}
