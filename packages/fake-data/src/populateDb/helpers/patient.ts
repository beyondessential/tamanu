import { times } from 'lodash';

import type { Patient } from '@tamanu/database';
import { randomRecordId } from '@tamanu/database/demoData/utilities';

import { fake, chance } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreatePatientParams extends CommonParams {
  facilityId?: string;
  userId?: string;
  isBirth?: boolean;
  isDead?: boolean;
  allergyCount?: number;
}
export const createPatient = async ({
  models,
  limit,
  facilityId,
  userId,
  isBirth = chance.bool(),
  isDead = chance.bool(),
  allergyCount = chance.integer({ min: 0, max: 5 }),
}: CreatePatientParams): Promise<{ patient: Patient }> => {
  const { Patient, PatientBirthData, PatientAllergy, PatientAdditionalData, PatientDeathData } =
    models;

  const patient = await Patient.create(fake(Patient));
  await PatientAdditionalData.create(
    fake(PatientAdditionalData, {
      patientId: patient.id,
    }),
  );

  if (isBirth) {
    await PatientBirthData.create(
      fake(PatientBirthData, {
        patientId: patient.id,
        facilityId: facilityId || (await randomRecordId(models, 'Facility')),
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

  await Promise.all(
    times(allergyCount, () =>
      limit(async () => {
        await PatientAllergy.create(
          fake(PatientAllergy, {
            patientId: patient.id,
          }),
        );
      }),
    ),
  );

  return { patient };
};

export const createPatientCommunication = async ({
  models: { PatientCommunication },
  patientId,
}: CommonParams & { patientId: string }) => {
  await PatientCommunication.create(
    fake(PatientCommunication, {
      patientId,
    }),
  );
};
