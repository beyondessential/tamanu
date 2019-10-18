import Chance from 'chance';
import shortid from 'shortid';

import { generateId } from '../utils/generateId';
import { VISIT_TYPES } from '../constants';

import { ALLERGIES } from './allergies';
import { DEPARTMENTS } from './departments';
import { DIAGNOSES } from './diagnoses';
import { LOCATIONS } from './locations';
import { USERS } from './users';

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const chance = new Chance();

function randomDate(minDaysAgo = 1, maxDaysAgo = 365) {
  const ago = chance.natural({ min: DAY * minDaysAgo, max: DAY * maxDaysAgo });
  return new Date(Date.now() - ago);
}

function randomDateBetween(start, end) {
  return new Date(chance.natural({ min: start.getTime(), max: end.getTime() }));
}

const randomRecord = (db, recordType, dummyData) => {
  const allRecords = db ? db.objects(recordType) : dummyData;
  return chance.pick(allRecords);
};

const randomUser = db => randomRecord(db, 'user', USERS);
const randomLocation = db => randomRecord(db, 'location', LOCATIONS);
const randomDepartment = db => randomRecord(db, 'department', DEPARTMENTS);
const randomDiagnosis = db => randomRecord(db, 'diagnosis', DIAGNOSES);

function randomAllergies(db) {
  const amount = chance.natural({ max: 3 });
  const allAllergies = db ? db.objects('allergy').slice() : ALLERGIES;
  return chance.pickset(allAllergies, amount).map(allergy => ({
    _id: shortid.generate(),
    allergy,
    practitioner: randomUser(db),
    date: randomDate(),
  }));
}

function randomConditions(db) {
  if (!db) return [];
  const amount = chance.natural({ max: 3 });
  return new Array(amount).fill(0).map(() => ({
    _id: shortid.generate(),
    condition: randomDiagnosis(db),
    practitioner: randomUser(db),
    date: randomDate(),
  }));
}

function randomVitals(overrides) {
  return {
    _id: shortid.generate(),
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

function randomPatientDiagnosis(db, overrides) {
  return {
    _id: shortid.generate(),
    date: randomDate(),
    diagnosis: randomDiagnosis(db),
    certainty: chance.pick(['suspected', 'confirmed']),
    isPrimary: false,
    ...overrides,
  };
}

export function createDummyVisit(db, current = false) {
  const endDate = current ? new Date() : randomDate();

  const duration = chance.natural({ min: HOUR, max: HOUR * 10 });
  const startDate = new Date(endDate.getTime() - duration);
  const primaryDiagnosis = randomPatientDiagnosis(db, {
    date: randomDateBetween(startDate, endDate),
    isPrimary: true,
  });
  const secondaryDiagnoses = new Array(chance.natural({ max: 3 }))
    .fill(0)
    .map(() => randomPatientDiagnosis(db, { date: randomDateBetween(startDate, endDate) }));

  return {
    _id: shortid.generate(),

    visitType: chance.pick(Object.values(VISIT_TYPES)),
    startDate: startDate,
    endDate: current ? undefined : endDate,
    location: randomLocation(db),
    department: randomDepartment(db),
    examiner: randomUser(db),
    reasonForVisit: '',

    vitals: [randomVitals({ dateRecorded: startDate })],
    notes: [],
    procedures: [],
    labs: [],
    imaging: [],
    medications: [],
    documents: [],
    diagnoses: [primaryDiagnosis, ...secondaryDiagnoses],
  };
}

export function createDummyPatient(db) {
  const gender = chance.pick(['male', 'female']);
  return {
    _id: shortid.generate(),
    displayId: generateId(),
    firstName: chance.first({ gender }),
    lastName: chance.last(),
    culturalName: chance.last(),
    sex: gender,
    dateOfBirth: chance.birthday(),
    visits: new Array(chance.natural({ max: 5 })).fill(0).map(() => createDummyVisit(db)),
    alerts: [],
    allergies: randomAllergies(db),
    conditions: randomConditions(db),
  };
}

export const PATIENTS = new Array(50).fill(0).map(() => createDummyPatient());
