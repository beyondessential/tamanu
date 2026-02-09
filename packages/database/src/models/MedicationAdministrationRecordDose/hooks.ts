import { type DestroyOptions } from 'sequelize';
import type { MedicationAdministrationRecordDose } from './MedicationAdministrationRecordDose';

const recalculateAndApplyInvoiceQuantity = async (instance: MedicationAdministrationRecordDose) => {
  const MedicationAdministrationRecord = instance.sequelize.models.MedicationAdministrationRecord;
  const mar = await MedicationAdministrationRecord.findByPk(instance.marId);
  if (mar && mar.prescriptionId) {
    await instance.sequelize.models.Prescription.recalculateAndApplyInvoiceQuantity(
      mar.prescriptionId,
      instance.recordedByUserId,
    );
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

export const afterBulkDestroyHook = async (options: DestroyOptions) => {
  const { model, where } = options;

  const instances = await model!.findAll({
    where,
    paranoid: false, // include deleted records to find what was just destroyed
  });

  for (const instance of instances) {
    await recalculateAndApplyInvoiceQuantity(instance as MedicationAdministrationRecordDose);
  }
};
