import { keyBy } from 'lodash';

/**
 * Returns when each ongoing prescription was last sent to pharmacy.
 *
 * When an ongoing prescription is sent to pharmacy, the system creates a new encounter, clones each
 * ongoing prescription to attach to that encounter, then creates a pharmacy order referencing those
 * clones. The clones have new IDs with no schema link back to the source ongoing prescriptions. We
 * infer the relationship by matching medication_id + patient + medicationDispensing encounter type.
 *
 * @param {Object} db - Sequelize db instance
 * @param {string} patientId - Patient ID
 * @param {string[]} ongoingPrescriptionIds - IDs of ongoing prescriptions
 * @param {Object} [options] - Optional query options
 * @param {Object} [options.transaction] - Sequelize transaction
 * @returns {Promise<Object>} Map of ongoing_prescription_id to { ongoing_prescription_id, last_ordered_at }
 */
export async function getLastOrderedAtForOngoingPrescriptions(
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
      AND e.encounter_type = 'medicationDispensing'
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
