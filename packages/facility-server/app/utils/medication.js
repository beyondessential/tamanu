import { keyBy } from 'es-toolkit/compat';

/**
 * Returns when each ongoing prescription was last sent to pharmacy, and whether that most
 * recent request has been dispensed.
 *
 * Uses the ongoing_prescription_id column on pharmacy_order_prescriptions to link
 * pharmacy order prescriptions (clones) back to their ongoing prescriptions.
 *
 * @param {Object} db - Sequelize db instance
 * @param {string[]} ongoingPrescriptionIds - IDs of ongoing prescriptions
 * @param {Object} [options] - Optional query options
 * @param {Object} [options.transaction] - Sequelize transaction
 * @returns {Promise<Object>} Map of ongoing_prescription_id to { ongoing_prescription_id, last_ordered_at, is_completed }
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
    SELECT DISTINCT ON (pop.ongoing_prescription_id)
      pop.ongoing_prescription_id,
      po.date as last_ordered_at,
      pop.is_completed
    FROM pharmacy_order_prescriptions pop
    INNER JOIN pharmacy_orders po ON po.id = pop.pharmacy_order_id
      AND po.deleted_at IS NULL
    WHERE pop.ongoing_prescription_id IN (:ongoingPrescriptionIds)
      AND pop.deleted_at IS NULL
    ORDER BY pop.ongoing_prescription_id, po.date DESC, pop.created_at DESC
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
