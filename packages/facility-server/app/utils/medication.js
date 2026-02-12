import { keyBy } from 'lodash';

/**
 * Fetches the latest pharmacy_order_prescriptions for prescriptions that were cloned from ongoing prescriptions.
 * Returns a map keyed by ongoing_prescription_id with { ongoing_prescription_id, last_ordered_at }.
 *
 * @param {Object} db - Sequelize db instance
 * @param {string} patientId - Patient ID
 * @param {string[]} ongoingPrescriptionIds - IDs of ongoing prescriptions
 * @param {Object} [options] - Optional query options
 * @param {Object} [options.transaction] - Sequelize transaction
 * @returns {Promise<Object>} Map of ongoing_prescription_id to { ongoing_prescription_id, last_ordered_at }
 */
export async function getLastOrderedPrescriptionDates(
  db,
  patientId,
  ongoingPrescriptionIds,
  options = {},
) {
  if (!ongoingPrescriptionIds?.length) {
    return {};
  }

  const [rows] = await db.query(
    `
    SELECT
      p_ongoing.id as ongoing_prescription_id,
      MAX(po.date) as last_ordered_at
    FROM prescriptions p_ongoing
    INNER JOIN prescriptions p_cloned ON p_cloned.medication_id = p_ongoing.medication_id
      AND p_cloned.deleted_at IS NULL
    INNER JOIN encounter_prescriptions ep_cloned ON ep_cloned.prescription_id = p_cloned.id
    INNER JOIN encounters e ON e.id = ep_cloned.encounter_id
      AND e.patient_id = :patientId
      AND e.reason_for_encounter = 'Medication dispensing'
    INNER JOIN pharmacy_order_prescriptions pop ON pop.prescription_id = p_cloned.id
      AND pop.deleted_at IS NULL
    INNER JOIN pharmacy_orders po ON po.id = pop.pharmacy_order_id
      AND po.deleted_at IS NULL
    WHERE p_ongoing.id IN (:ongoingPrescriptionIds)
    GROUP BY p_ongoing.id
  `,
    {
      replacements: {
        patientId,
        ongoingPrescriptionIds,
      },
      ...options,
    },
  );

  return keyBy(rows, 'ongoing_prescription_id');
}
