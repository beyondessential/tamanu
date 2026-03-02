import { type DestroyOptions, type UpdateOptions } from 'sequelize';
import { MedicationAdministrationRecordDose } from './MedicationAdministrationRecordDose';

const recalculateAndApplyInvoiceQuantity = async (instance: MedicationAdministrationRecordDose) => {
  const { models } = instance.sequelize;
  const prescription = await models.Prescription.findOne({
    include: [
      {
        model: models.MedicationAdministrationRecord,
        as: 'medicationAdministrationRecords',
        where: { id: instance.marId },
        required: true,
      },
      {
        model: models.EncounterPrescription,
        as: 'encounterPrescription',
        required: true,
        include: [{ model: models.Encounter, as: 'encounter', required: true }],
      },
    ],
  });
  if (prescription) {
    await prescription.recalculateAndApplyInvoiceQuantity(instance.recordedByUserId);
  }
};

export const afterCreateHook = async (instance: MedicationAdministrationRecordDose) => {
  await recalculateAndApplyInvoiceQuantity(instance);
};

export const afterUpdateHook = async (instance: MedicationAdministrationRecordDose) => {
  await recalculateAndApplyInvoiceQuantity(instance);
};

export const afterDestroyHook = async (instance: MedicationAdministrationRecordDose) => {
  await recalculateAndApplyInvoiceQuantity(instance);
};

export const afterBulkCreateHook = async (instances: MedicationAdministrationRecordDose[]) => {
  for (const instance of instances) {
    await recalculateAndApplyInvoiceQuantity(instance as MedicationAdministrationRecordDose);
  }
};

export const afterBulkUpdateHook = async (options: UpdateOptions) => {
  const { where } = options;
  const instances = await MedicationAdministrationRecordDose.findAll({
    where,
  });

  for (const instance of instances) {
    await recalculateAndApplyInvoiceQuantity(instance as MedicationAdministrationRecordDose);
  }
};

export const afterBulkDestroyHook = async (options: DestroyOptions) => {
  const { where } = options;
  const instances = await MedicationAdministrationRecordDose.findAll({
    where,
    paranoid: false, // include deleted records to find what was just destroyed
  });

  for (const instance of instances) {
    await recalculateAndApplyInvoiceQuantity(instance as MedicationAdministrationRecordDose);
  }
};
