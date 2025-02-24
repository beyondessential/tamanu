import type { Models, Patient } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreatePatientDataParams {
  models: Models;
  facilityId: string;
  userId: string;
}
export const createPatient = async ({
  models: {
    Patient,
    PatientAllergy,
    PatientAdditionalData,
    PatientDeathData,
    PatientCommunication,
  },
  userId,
}: CreatePatientDataParams): Promise<{ patient: Patient }> => {
  const patient = await Patient.create(fake(Patient));
  await PatientAllergy.create(
    fake(PatientAllergy, {
      patientId: patient.id,
    }),
  );

  await PatientAdditionalData.create(
    fake(PatientAdditionalData, {
      patientId: patient.id,
    }),
  );

  await PatientDeathData.create(
    fake(PatientDeathData, {
      patientId: patient.id,
      clinicianId: userId,
    }),
  );

  await PatientCommunication.create(
    fake(PatientCommunication, {
      patientId: patient.id,
    }),
  );

  return { patient };
};

export const createPatientBirth = async ({
  models: {
    Patient,
    PatientBirthData,
    PatientAllergy,
    PatientAdditionalData,
    PatientDeathData,
    PatientCommunication,
  },
  facilityId,
  userId,
}: CreatePatientDataParams): Promise<{ patient: Patient }> => {
  const patient = await Patient.create(fake(Patient));
  await PatientBirthData.create(
    fake(PatientBirthData, {
      patientId: patient.id,
      facilityId,
    }),
  );
  await PatientAllergy.create(
    fake(PatientAllergy, {
      patientId: patient.id,
    }),
  );

  await PatientAdditionalData.create(
    fake(PatientAdditionalData, {
      patientId: patient.id,
    }),
  );

  await PatientDeathData.create(
    fake(PatientDeathData, {
      patientId: patient.id,
      clinicianId: userId,
    }),
  );

  await PatientCommunication.create(
    fake(PatientCommunication, {
      patientId: patient.id,
    }),
  );

  return { patient };
};
