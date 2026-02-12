import { keyBy } from 'lodash';

/**
 * Returns when each ongoing prescription was last sent to pharmacy.
 *
 * Uses the source_prescription_id column on pharmacy_order_prescriptions to link
 * pharmacy order prescriptions (clones) back to their source ongoing prescriptions.
 *
 * @param {Object} db - Sequelize db instance
 * @param {string} patientId - Patient ID (unused, kept for API compatibility)
 * @param {string[]} ongoingPrescriptionIds - IDs of ongoing prescriptions
 * @param {Object} [options] - Optional query options
 * @param {Object} [options.transaction] - Sequelize transaction
 * @returns {Promise<Object>} Map of ongoing_prescription_id to { ongoing_prescription_id, last_ordered_at }
 */
export async function getLastOrderedAtForOngoingPrescriptions(
  db,
  ongoingPrescriptionIds,
  options = {},
) {
  if (!ongoingPrescriptionIds?.length) {
    return {};
  }

  const [rows] = await db.query(
    `
    SELECT
      pop.source_prescription_id as ongoing_prescription_id,
      MAX(po.date) as last_ordered_at
    FROM pharmacy_order_prescriptions pop
    INNER JOIN pharmacy_orders po ON po.id = pop.pharmacy_order_id
      AND po.deleted_at IS NULL
    WHERE pop.source_prescription_id IN (:ongoingPrescriptionIds)
      AND pop.deleted_at IS NULL
    GROUP BY pop.source_prescription_id
  `,
    {
      replacements: {
        ongoingPrescriptionIds,
      },
      ...options,
    },
  );

  return keyBy(rows, 'ongoing_prescription_id');
}
