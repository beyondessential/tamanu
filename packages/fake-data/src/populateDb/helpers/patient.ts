import { parseISO } from 'date-fns';
import { times } from 'es-toolkit/compat';

import { REFERENCE_TYPES } from '@tamanu/constants';
import type { Patient } from '@tamanu/database';
import { randomRecordId } from '../randomRecord.js';

import { toDateTimeString } from '@tamanu/utils/dateTime';
import { fake, chance, fakeDate } from '../../fake/index.js';
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
  isDead = chance.bool({ likelihood: 5 }),
  allergyCount = chance.integer({ min: 0, max: 5 }),
}: CreatePatientParams): Promise<{ patient: Patient }> => {
  const {
    Patient,
    PatientBirthData,
    PatientAllergy,
    PatientAdditionalData,
    PatientDeathData,
    ReferenceData,
  } = models;

  const patientFields = fake(Patient);
  const patient = await Patient.create(
    isDead
      ? {
          ...patientFields,
          dateOfDeath: toDateTimeString(
            new Date(Math.max(fakeDate().getTime(), parseISO(patientFields.dateOfBirth).getTime())),
          ),
        }
      : patientFields,
  );
  await PatientAdditionalData.create(
    fake(PatientAdditionalData, {
      patientId: patient.id,
      registeredById: userId || (await randomRecordId(models, 'User')),
    }),
  );

  if (isBirth) {
    await PatientBirthData.create(
      fake(PatientBirthData, {
        patientId: patient.id,
        facilityId: facilityId || (await randomRecordId(models, 'Facility')),
        timeOfBirth: `${patient.dateOfBirth} ${chance.integer({ min: 10, max: 23 })}:00:00`,
      }),
    );
  }

  if (isDead) {
    await PatientDeathData.create(
      fake(PatientDeathData, {
        patientId: patient.id,
        clinicianId: userId || (await randomRecordId(models, 'User')),
        ...(patient.sex !== 'female' && {
          wasPregnant: null,
          pregnancyContributed: null,
          pregnancyMoment: null,
        }),
      }),
    );
  }

  if (allergyCount > 0) {
    // Pick from the shared allergy pool (seeded in generateImportData) rather
    // than minting a ReferenceData per allergy. Fetched once per patient.
    const allergyRows = await ReferenceData.findAll({
      where: { type: REFERENCE_TYPES.ALLERGY },
      attributes: ['id'],
      raw: true,
    });
    const allergyIds = allergyRows.map((row: { id: string }) => row.id);
    for (const _ of times(allergyCount)) {
      await PatientAllergy.create(
        fake(PatientAllergy, {
          patientId: patient.id,
          allergyId: allergyIds.length ? chance.pickone(allergyIds) : null,
        }),
      );
    }
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
