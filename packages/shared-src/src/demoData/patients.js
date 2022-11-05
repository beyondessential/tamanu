import Chance from 'chance';
import { addHours, subMinutes } from 'date-fns';

import { ENCOUNTER_TYPES } from '../constants';
import { generateId } from '../utils/generateId';
import { TIME_INTERVALS, randomDate, randomRecordId } from './utilities';
import { getCurrentDateTimeString, toDateString, toDateTimeString } from '../utils/dateTime';

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
    dateRecorded: toDateTimeString(randomDate()),
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
  const arrivalTime = subMinutes(new Date(), chance.integer({ min: 2, max: 80 }));
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
  const endDate = current ? getCurrentDateTimeString() : toDateTimeString(randomDate());

  const duration = chance.natural({ min: HOUR, max: HOUR * 10 });
  const startDate = toDateTimeString(new Date(new Date(endDate).getTime() - duration));

  return {
    encounterType: chance.pickone(Object.values(ENCOUNTER_TYPES)),
    startDate,
    endDate: current ? undefined : endDate,
    reasonForEncounter: chance.sentence({ words: chance.integer({ min: 4, max: 8 }) }),
    locationId: await randomRecordId(models, 'Location'),
    departmentId: await randomRecordId(models, 'Department'),
    examinerId: await randomUser(models),
    ...overrides,
  };
}

export function createDummyPatient(models, overrides = {}) {
  const gender = overrides.sex || chance.pickone(['male', 'female']);
  const title = overrides.title || chance.pickone(['Mr', 'Mrs', 'Ms']);
  return {
    displayId: generateId(),
    firstName: chance.first({ gender }),
    lastName: chance.last(),
    culturalName: chance.last(),
    sex: chance.bool({ likelihood: 5 }) ? 'other' : gender,
    dateOfBirth: toDateString(chance.birthday()),
    title,
    ...overrides,
  };
}

const randomDigits = length => chance.string({ length, pool: '0123456789' });

function randomPhoneNumber() {
  return `04${randomDigits(2)} ${randomDigits(3)} ${randomDigits(3)}`;
}

export function createDummyPatientAdditionalData() {
  return {
    placeOfBirth: chance.city(),
    bloodType: chance.pickone(['A+', 'B+', 'A-', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    primaryContactNumber: randomPhoneNumber(),
    secondaryContactNumber: randomPhoneNumber(),
    maritalStatus: chance.pickone(['Single', 'Married', 'Defacto']),
    cityTown: chance.city(),
    streetVillage: `${Math.floor(Math.random() * 200)} ${chance.street({ short_suffix: true })}`,
    drivingLicense: randomDigits(10),
    passport: randomDigits(10),
  };
}

export async function createDummyEncounterDiagnosis(models, overrides = {}) {
  const duration = chance.natural({
    min: HOUR,
    max: HOUR * 10,
  });
  const date = toDateTimeString(new Date(new Date().getTime() - duration));
  return {
    date,
    certainty: chance.bool() ? 'suspected' : 'confirmed',
    isPrimary: chance.bool(),
    diagnosisId: await randomReferenceId(models, 'icd10'),
    ...overrides,
  };
}

// Needs a manually created encounter to be linked with
export async function createDummyEncounterMedication(models, overrides = {}) {
  return {
    date: getCurrentDateTimeString(),
    endDate: toDateTimeString(addHours(new Date(), 1)),
    prescription: chance.sentence({ words: chance.integer({ min: 4, max: 8 }) }),
    note: chance.sentence({ words: chance.integer({ min: 4, max: 8 }) }),
    indication: chance.sentence({ words: chance.integer({ min: 4, max: 8 }) }),
    route: chance.word(),
    qtyMorning: chance.integer({ min: 0, max: 3 }),
    qtyLunch: chance.integer({ min: 0, max: 3 }),
    qtyEvening: chance.integer({ min: 0, max: 3 }),
    qtyNight: chance.integer({ min: 0, max: 3 }),
    quantity: chance.integer({ min: 0, max: 3 }),
    repeats: 0,
    isDischarge: false,
    prescriberId: await randomUser(models),
    medicationId: await randomReferenceId(models, 'drug'),
    ...overrides,
  };
}
