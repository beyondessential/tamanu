import { times } from 'lodash';

import type { Models, Patient } from '@tamanu/database';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

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
  models,
  facilityId,
  userId,
  isBirth = chance.bool(),
  isPad = chance.bool(),
  isDead = chance.bool(),
  allergyCount = chance.integer({ min: 0, max: 5 }),
}: CreatePatientParams): Promise<{ patient: Patient }> => {
  const { Patient, PatientBirthData, PatientAllergy, PatientAdditionalData, PatientDeathData } =
    models;

  const patient = await Patient.create(fake(Patient));

  if (isBirth) {
    await PatientBirthData.create(
      fake(PatientBirthData, {
        patientId: patient.id,
        facilityId: facilityId || (await randomRecordId(models, 'Facility')),
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
        clinicianId: userId || (await randomRecordId(models, 'User')),
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
