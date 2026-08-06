import { keyBy } from 'es-toolkit/compat';
import { PHARMACY_PRESCRIPTION_TYPES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

/**
 * Sensitive drugs need their own permission on top of the medication one. `action` is the verb
 * being performed on the medication itself, e.g. 'create' when prescribing, 'read' when ordering.
 */
export const checkSensitiveMedicationPermission = async (medicationIds, req, action) => {
  if (!medicationIds?.length) return;

  const isSensitive = await req.models.ReferenceDrug.hasSensitiveMedication(medicationIds);
  if (isSensitive) {
    req.checkPermission(action, 'SensitiveMedication');
  }
};

/**
 * Permissions required to place a pharmacy order, wherever it is raised from — the pharmacy order
 * modal, a discharge, or a new prescription.
 */
export const checkPharmacyOrderPermission = async (req, medicationIds) => {
  req.checkPermission('create', 'MedicationRequest');
  req.checkPermission('read', 'Medication');
  await checkSensitiveMedicationPermission(medicationIds, req, 'read');
};

/**
 * Raises a pharmacy order over `lines`, each `{ prescriptionId, quantity, repeats }` and optionally
 * `ongoingPrescriptionId` so a line cloned from an ongoing prescription still resolves its
 * last-sent date from the patient view.
 *
 * Relies on the ambient CLS transaction, so callers must already be inside one where the order has
 * to stand or fall with the rest of their work.
 */
export const createPharmacyOrder = async ({
  models,
  encounterId,
  facilityId,
  orderingClinicianId,
  isDischargePrescription,
  lines,
  comments,
  date,
}) => {
  const pharmacyOrder = await models.PharmacyOrder.create({
    orderingClinicianId,
    encounterId,
    comments,
    isDischargePrescription,
    // `||` rather than `??`: a blank date off a request body means "now", not a blank date.
    date: date || getCurrentDateTimeString(),
    facilityId,
  });

  await models.PharmacyOrderPrescription.bulkCreate(
    lines.map(({ prescriptionId, quantity, repeats, ongoingPrescriptionId = null }) => ({
      pharmacyOrderId: pharmacyOrder.id,
      prescriptionId,
      quantity,
      repeats,
      ongoingPrescriptionId,
    })),
  );

  return pharmacyOrder;
};

/**
 * Raises a pharmacy order for a single freshly created prescription, mirroring what the pharmacy
 * order modal does for a hand-picked set of an encounter's medications. The order belongs to the
 * encounter's own facility rather than whichever one the request came from.
 */
export const createPharmacyOrderForPrescription = async ({
  models,
  encounter,
  prescription,
  prescriptionType,
  orderingClinicianId,
}) => {
  const location = await models.Location.findByPk(encounter.locationId, {
    attributes: ['facilityId'],
  });
  if (!location?.facilityId) {
    throw new InvalidOperationError(
      `Cannot send prescription to pharmacy: encounter ${encounter.id} has no facility`,
    );
  }

  return createPharmacyOrder({
    models,
    encounterId: encounter.id,
    facilityId: location.facilityId,
    orderingClinicianId,
    isDischargePrescription:
      prescriptionType === PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT,
    lines: [
      {
        prescriptionId: prescription.id,
        quantity: prescription.quantity,
        repeats: prescription.repeats,
      },
    ],
  });
};

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
