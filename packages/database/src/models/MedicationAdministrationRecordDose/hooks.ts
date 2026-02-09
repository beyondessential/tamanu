import { ADMINISTRATION_STATUS } from '@tamanu/constants';
import type { MedicationAdministrationRecordDose } from './MedicationAdministrationRecordDose';

const recalculateAndApplyInvoiceQuantity = async (instance: MedicationAdministrationRecordDose) => {
  const MedicationAdministrationRecord = instance.sequelize.models.MedicationAdministrationRecord;
  const Prescription = instance.sequelize.models.Prescription;

  const mar = await MedicationAdministrationRecord.findByPk(instance.marId);
  if (mar && mar.prescriptionId && mar.status === ADMINISTRATION_STATUS.GIVEN) {
    await Prescription.recalculateAndApplyInvoiceQuantity(
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
