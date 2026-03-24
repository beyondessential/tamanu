import { ADMINISTRATION_FREQUENCIES, SYSTEM_USER_UUID } from '@tamanu/constants';
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

export const afterCreateHook = async (instance: MedicationAdministrationRecord) => {
  await Promise.all([
    discontinuePrescriptionIfNeeded(instance),
    createTaskAfterCreateHook(instance),
  ]);
};

export const afterUpdateHook = async (instance: MedicationAdministrationRecord) => {
  await Promise.all([
    discontinuePrescriptionIfNeeded(instance),
    completeTaskAfterUpdateHook(instance),
  ]);
};
