import {
  ADMINISTRATION_STATUS,
  INVOICE_ITEMS_CATEGORIES,
  ADMINISTRATION_FREQUENCIES,
  INVOICEABLE_MEDICATION_ENCOUNTER_TYPES,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import type { MedicationAdministrationRecord } from './MedicationAdministrationRecord';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Op } from 'sequelize';

const createTaskAfterCreateHook = async (instance: MedicationAdministrationRecord) => {
  // Create a task for the MAR if it's not recorded yet
  if (!instance.status) {
    await instance.sequelize.models.MedicationAdministrationRecord.createMedicationDueTaskForMar(
      instance,
    );
  }
};

const completeTaskAfterUpdateHook = async (instance: MedicationAdministrationRecord) => {
  const previousStatus = instance.previous('status');
  if (!previousStatus && instance.status) {
    await instance.sequelize.models.MedicationAdministrationRecord.checkAndCompleteMedicationDueTask(
      instance,
    );
  }
};

const discontinuePrescriptionIfNeeded = async (instance: MedicationAdministrationRecord) => {
  // If the prescription is immediately and the MAR is the first time being not given, then discontinue the prescription
  // https://linear.app/bes/issue/EPI-1143/automatically-discontinue-prescriptions-with-frequency-of-immediately
  const prescription = await instance.sequelize.models.Prescription.findByPk(
    instance.prescriptionId,
  );
  if (
    prescription?.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY &&
    !prescription?.discontinued &&
    instance.status
  ) {
    Object.assign(prescription, {
      discontinuingReason: 'STAT dose recorded',
      discontinuingClinicianId: SYSTEM_USER_UUID,
      discontinuedDate: getCurrentDateTimeString(),
      discontinued: true,
    });
    await prescription.save();
  }
};

const getInvoiceContext = async (instance: MedicationAdministrationRecord) => {
  const { Prescription, EncounterPrescription, Encounter } = instance.sequelize.models;

  const prescription = await Prescription.findByPk(instance.prescriptionId, {
    include: [
      {
        model: EncounterPrescription,
        as: 'encounterPrescription',
        required: true,
        include: [
          {
            model: Encounter,
            as: 'encounter',
            required: true,
          },
        ],
      },
    ],
  });

  const encounter = prescription?.encounterPrescription?.encounter;

  if (
    !encounter ||
    !INVOICEABLE_MEDICATION_ENCOUNTER_TYPES.includes(encounter.encounterType || '')
  ) {
    return null;
  }

  return { prescription, encounter };
};

// Compute final invoice quantity using business rules:
// - If any PharmacyOrderPrescription exists for this prescription, MAR doses after the earliest pharmacy order date are ignored.
// - Quantity = (MAR Given total up to first 'sent to pharmacy' date, or all MAR Given if none sent) + (sum of 'sent to pharmacy' quantities)
const recalculateAndApplyInvoiceQuantity = async (instance: MedicationAdministrationRecord) => {
  const invoiceContext = await getInvoiceContext(instance);
  if (!invoiceContext) return;
  const { prescription, encounter } = invoiceContext;

  const {
    InvoiceProduct,
    Invoice,
    MedicationAdministrationRecord,
    MedicationAdministrationRecordDose,
    PharmacyOrderPrescription,
    PharmacyOrder,
  } = instance.sequelize.models;

  // Find product for the drug
  const invoiceProduct = await InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.DRUG,
      sourceRecordId: prescription.medicationId,
    },
  });
  if (!invoiceProduct) return;

  // Gather pharmacy orders for this prescription (Method 1)
  const pharmacyOrderPrescriptions = await PharmacyOrderPrescription.findAll({
    where: { prescriptionId: prescription.id },
    include: [{ model: PharmacyOrder, as: 'pharmacyOrder', attributes: ['date'] }],
  });

  const hasPharmacy = pharmacyOrderPrescriptions.length > 0;
  const earliestPharmacyDate = hasPharmacy
    ? new Date(
        pharmacyOrderPrescriptions
          .map(pop => new Date(pop?.pharmacyOrder?.date as unknown as string))
          .sort((a, b) => a.getTime() - b.getTime())[0]!,
      )
    : undefined;

  const totalSentQuantity = pharmacyOrderPrescriptions.reduce(
    (sum: number, pop: any) => sum + (Number(pop.quantity) || 0),
    0,
  );

  // Compute MAR Given quantity (Method 2)
  const givenMars = await MedicationAdministrationRecord.findAll({
    where: { prescriptionId: prescription.id, status: ADMINISTRATION_STATUS.GIVEN },
    attributes: ['id'],
  });
  let marQuantity = 0;
  if (givenMars.length > 0) {
    const marIds = givenMars.map((m: any) => m.id);
    const doses = await MedicationAdministrationRecordDose.findAll({
      where: {
        marId: { [Op.in]: marIds },
        isRemoved: { [Op.ne]: true },
        ...(earliestPharmacyDate
          ? {
              givenTime: { [Op.lte]: earliestPharmacyDate },
            }
          : {}),
      },
      attributes: ['doseAmount', 'givenTime'],
    });
    marQuantity = doses.reduce((sum: number, d: any) => sum + Number(d.doseAmount || 0), 0);
  }

  const finalQuantity = marQuantity + totalSentQuantity;

  if (finalQuantity > 0) {
    await Invoice.setItemQuantityForInvoice(
      prescription,
      encounter.id,
      invoiceProduct,
      finalQuantity,
      instance.recordedByUserId,
    );
  } else {
    // Only remove if there are no pharmacy orders and no MAR Given doses
    await Invoice.removeItemFromInvoice(prescription, encounter.id);
  }
};

export const afterCreateHook = async (instance: MedicationAdministrationRecord) => {
  await Promise.all([
    discontinuePrescriptionIfNeeded(instance),
    createTaskAfterCreateHook(instance),
  ]);
  // Recalculate invoice after create (covers when status is GIVEN or NOT GIVEN)
  await recalculateAndApplyInvoiceQuantity(instance);
};

export const afterUpdateHook = async (instance: MedicationAdministrationRecord) => {
  await Promise.all([
    discontinuePrescriptionIfNeeded(instance),
    completeTaskAfterUpdateHook(instance),
  ]);
  // Recalculate invoice after update to handle add/update/remove behaviors
  await recalculateAndApplyInvoiceQuantity(instance);
};
