import { QueryInterface } from 'sequelize';

/**
 * Backfill source_prescription_id for pharmacy_order_prescriptions created from
 * ongoing prescriptions (Medication dispensing encounters).
 *
 * Matches clone prescriptions to their source ongoing prescription by
 * medication_id + patient. When multiple ongoing prescriptions match (same
 * medication), uses the most recent by start_date.
 */
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE pharmacy_order_prescriptions pop
    SET source_prescription_id = sub.source_prescription_id
    FROM (
      SELECT DISTINCT ON (pop_inner.id)
        pop_inner.id AS pop_id,
        p_ongoing.id AS source_prescription_id
      FROM pharmacy_order_prescriptions pop_inner
      INNER JOIN prescriptions p_cloned ON p_cloned.id = pop_inner.prescription_id
        AND p_cloned.deleted_at IS NULL
      INNER JOIN encounter_prescriptions ep_cloned ON ep_cloned.prescription_id = p_cloned.id
      INNER JOIN encounters e ON e.id = ep_cloned.encounter_id
        AND e.reason_for_encounter = 'Medication dispensing'
      INNER JOIN patient_ongoing_prescriptions pop_ongoing ON pop_ongoing.patient_id = e.patient_id
      INNER JOIN prescriptions p_ongoing ON p_ongoing.id = pop_ongoing.prescription_id
        AND p_ongoing.medication_id = p_cloned.medication_id
        AND p_ongoing.deleted_at IS NULL
      WHERE pop_inner.deleted_at IS NULL
        AND pop_inner.source_prescription_id IS NULL
      ORDER BY pop_inner.id, p_ongoing.start_date DESC NULLS LAST
    ) sub
    WHERE pop.id = sub.pop_id
  `);
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: Backfill cannot be reversed - we would lose the inferred source links
  // No-op; column removal handled by the DDL migration down
}
