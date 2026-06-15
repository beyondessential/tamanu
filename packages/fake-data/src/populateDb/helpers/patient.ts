import { times } from 'lodash';

import { REFERENCE_TYPES } from '@tamanu/constants';
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

  for (const _ of times(allergyCount)) {
    const allergy = await models.ReferenceData.findOne({
      where: { type: REFERENCE_TYPES.ALLERGY },
      order: models.ReferenceData.sequelize.random(),
    });
    await PatientAllergy.create(
      fake(PatientAllergy, {
        patientId: patient.id,
        allergyId: allergy?.id ?? null,
      }),
    );
  }

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

interface CreatePatientViewLogParams extends CommonParams {
  facilityId: string;
  userId: string;
  patientId: string;
}
export const createAccessLog = async ({
  models,
  patientId,
  userId,
  facilityId,
}: CreatePatientViewLogParams) => {
  const { AccessLog } = models;
  await AccessLog.create(
    fake(AccessLog, {
      recordId: patientId,
      userId: userId || (await randomRecordId(models, 'User')),
      facilityId: facilityId || (await randomRecordId(models, 'Facility')),
      recordType: 'Patient',
      frontEndContext: { patientId },
      backEndContext: { endPoint: '/patient/:id' },
    }),
  );
};
