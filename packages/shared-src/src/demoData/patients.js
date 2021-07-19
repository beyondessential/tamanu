import Chance from 'chance';
import moment from 'moment';

import { generateId } from '../utils/generateId';
import { ENCOUNTER_TYPES } from '../constants';
import { TIME_INTERVALS, randomDate, randomRecordId } from './utilities';

const { HOUR } = TIME_INTERVALS;

const chance = new Chance();

export async function randomUser(models) {
  return randomRecordId(models, 'User');
}

export async function randomReferenceId(models, type) {
  const obj = await models.ReferenceData.findOne({
    where: {
      type,
    },
    order: models.ReferenceData.sequelize.random(),
  });
  return obj.id;
}

export async function randomReferenceIds(models, type, count) {
  const items = await models.ReferenceData.findAll({
    where: {
      type,
    },
    order: models.ReferenceData.sequelize.random(),
    limit: count,
  });
  return items.map(i => i.id);
}

export async function randomReferenceData(models, type) {
  const obj = await models.ReferenceData.findOne({
    where: {
      type,
    },
    order: models.ReferenceData.sequelize.random(),
  });
  return obj;
}

export async function randomReferenceDataObjects(models, type, count) {
  const objects = await models.ReferenceData.findAll({
    where: {
      type,
    },
    order: models.ReferenceData.sequelize.random(),
    limit: count,
  });
  return objects;
}

export function randomVitals(overrides) {
  return {
    dateRecorded: randomDate(),
    weight: chance.floating({ min: 60, max: 150 }),
    height: chance.floating({ min: 130, max: 190 }),
    sbp: chance.floating({ min: 115, max: 125 }),
    dbp: chance.floating({ min: 75, max: 85 }),
    temperature: chance.floating({ min: 36, max: 38 }),
    heartRate: chance.floating({ min: 40, max: 140 }),
    respiratoryRate: chance.floating({ min: 10, max: 18 }),
    ...overrides,
  };
}

export async function createDummyTriage(models, overrides) {
  const arrivalTime = moment()
    .subtract(chance.integer({ min: 2, max: 80 }), 'minutes')
    .toDate();
  return {
    score: chance.integer({ min: 1, max: 5 }),
    notes: chance.sentence(),
    arrivalTime,
    triageTime: arrivalTime,
    closedTime: null,
    chiefComplaintId: await randomReferenceId(models, 'triageReason'),
    secondaryComplaintId: chance.bool() ? null : await randomReferenceId(models, 'triageReason'),
    locationId: await randomRecordId(models, 'Location'),
    practitionerId: await randomUser(models),
    ...overrides,
  };
}

export async function createDummyEncounter(models, { current, ...overrides } = {}) {
  const endDate = current ? new Date() : randomDate();

  const duration = chance.natural({ min: HOUR, max: HOUR * 10 });
  const startDate = new Date(endDate.getTime() - duration);

  return {
    encounterType: chance.pick(Object.values(ENCOUNTER_TYPES)),
    startDate: startDate,
    endDate: current ? undefined : endDate,
    reasonForEncounter: chance.sentence({ words: chance.integer({ min: 4, max: 8 }) }),
    locationId: await randomRecordId(models, 'Location'),
    departmentId: await randomRecordId(models, 'Department'),
    examinerId: await randomUser(models),
    ...overrides,
  };
}

export async function createDummyPatient(models, overrides = {}) {
  const gender = overrides.sex || chance.pick(['male', 'female']);
  const title = overrides.title || chance.pick(['Mr', 'Mrs', 'Ms']);
  return {
    displayId: generateId(),
    firstName: chance.first({ gender }),
    lastName: chance.last(),
    culturalName: chance.last(),
    sex: chance.bool({ likelihood: 5 }) ? 'other' : gender,
    dateOfBirth: chance.birthday(),
    title,
    ...overrides,
  };
}

export async function createDummyEncounterDiagnosis(models, overrides = {}) {
  const duration = chance.natural({
    min: HOUR,
    max: HOUR * 10,
  });
  const date = new Date(new Date().getTime() - duration);
  return {
    date,
    certainty: chance.bool() ? 'suspected' : 'confirmed',
    isPrimary: chance.bool(),
    diagnosisId: await randomReferenceId(models, 'icd10'),
    ...overrides,
  };
}
