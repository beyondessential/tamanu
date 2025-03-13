import type { Models, Patient } from '@tamanu/database';
import { times } from 'lodash';
import { fake, chance } from '../../fake';

interface CreatePatientParams {
  models: Models;
  facilityId: string;
  userId: string;
  isBirth?: boolean;
  isPad?: boolean;
  isDead?: boolean;
  allergyCount?: number;
}
export const createPatient = async ({
  models: { Patient, PatientBirthData, PatientAllergy, PatientAdditionalData, PatientDeathData },
  facilityId,
  userId,
  isBirth = chance.bool(),
  isPad = chance.bool(),
  isDead = chance.bool(),
  allergyCount = chance.integer({ min: 0, max: 5 }),
}: CreatePatientParams): Promise<{ patient: Patient }> => {
  const patient = await Patient.create(fake(Patient));

  if (isBirth) {
    await PatientBirthData.create(
      fake(PatientBirthData, {
        patientId: patient.id,
        facilityId,
      }),
    );
  }

  if (isPad) {
    await PatientAdditionalData.create(
      fake(PatientAdditionalData, {
        patientId: patient.id,
      }),
    );
  }

  if (isDead) {
    await PatientDeathData.create(
      fake(PatientDeathData, {
        patientId: patient.id,
        clinicianId: userId,
      }),
    );
  }

  times(allergyCount, async () => {
    await PatientAllergy.create(
      fake(PatientAllergy, {
        patientId: patient.id,
      }),
    );
  });

  return { patient };
};

export const createPatientCommunication = async ({
  models: { PatientCommunication },
  patientId,
}) => {
  await PatientCommunication.create(
    fake(PatientCommunication, {
      patientId,
    }),
  );
};

interface CreatePatientViewLogParams {
  models: Models;
  facilityId: string;
  userId: string;
  patientId: string;
}
export const createAccessLog = async ({
  models: { Access },
  patientId,
  userId,
  facilityId,
}: CreatePatientViewLogParams) => {
  await Access.create({
    userId: userId,
    recordId: patientId,
    facilityId,
    recordType: 'Patient',
    isMobile: chance.bool(),
    frontEndContext: { patientId },
    backEndContext: { endPoint: '/patient/:id' },
  });
};
