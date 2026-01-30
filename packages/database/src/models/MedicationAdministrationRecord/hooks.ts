import {
  ADMINISTRATION_STATUS,
  INVOICE_ITEMS_CATEGORIES,
  ADMINISTRATION_FREQUENCIES,
  INVOICEABLE_MEDICATION_ENCOUNTER_TYPES,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import type { MedicationAdministrationRecord } from './MedicationAdministrationRecord';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

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

const addToInvoice = async (instance: MedicationAdministrationRecord) => {
  if (instance.status !== ADMINISTRATION_STATUS.GIVEN) {
    return;
  }

  const invoiceContext = await getInvoiceContext(instance);
  if (!invoiceContext) {
    return;
  }
  const { prescription, encounter } = invoiceContext;

  const invoiceProduct = await instance.sequelize.models.InvoiceProduct.findOne({
    where: {
      category: INVOICE_ITEMS_CATEGORIES.DRUG,
      sourceRecordId: prescription.medicationId,
    },
  });
  if (!invoiceProduct) {
    return;
  }
  // By using the prescription as the source record, we can ensure there will be a single invoice item regardless of how many times the medication is given
  await instance.sequelize.models.Invoice.addItemToInvoice(
    prescription,
    encounter.id,
    invoiceProduct,
    instance.recordedByUserId,
  );
};

const removeFromInvoice = async (instance: MedicationAdministrationRecord) => {
  const invoiceContext = await getInvoiceContext(instance);
  if (!invoiceContext) {
    return;
  }
  const { prescription, encounter } = invoiceContext;

  const allMedicationAdministrationRecordsForPrescription =
    await instance.sequelize.models.MedicationAdministrationRecord.findAll({
      where: {
        prescriptionId: prescription.id,
      },
    });

  if (
    allMedicationAdministrationRecordsForPrescription.some(
      mar => mar.status === ADMINISTRATION_STATUS.GIVEN,
    )
  ) {
    // If any of the MARs for this prescription are still given, don't remove the invoice item
    return;
  }

  await instance.sequelize.models.Invoice.removeItemFromInvoice(prescription, encounter.id);
};

const addOrRemoveFromInvoiceAfterUpdateHook = async (instance: MedicationAdministrationRecord) => {
  if (instance.status === ADMINISTRATION_STATUS.GIVEN) {
    await addToInvoice(instance);
  } else {
    await removeFromInvoice(instance);
  }
};

export const afterCreateHook = async (instance: MedicationAdministrationRecord) => {
  await Promise.all([
    discontinuePrescriptionIfNeeded(instance),
    createTaskAfterCreateHook(instance),
    addToInvoice(instance),
  ]);
};

export const afterUpdateHook = async (instance: MedicationAdministrationRecord) => {
  await Promise.all([
    discontinuePrescriptionIfNeeded(instance),
    completeTaskAfterUpdateHook(instance),
    addOrRemoveFromInvoiceAfterUpdateHook(instance),
  ]);
};
