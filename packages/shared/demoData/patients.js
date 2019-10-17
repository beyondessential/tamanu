import Chance from 'chance';
import shortid from 'shortid';

import { VISIT_TYPES } from '../constants';
import { generateId } from '../utils/generateId';
import { ALLERGIES } from './allergies';
import { PRACTITIONERS } from './practitioners';
import { CONDITIONS } from './conditions';
import { LOCATIONS } from './locations';

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const chance = new Chance();

function randomDate(minDaysAgo = 1, maxDaysAgo = 365) {
  const ago = chance.natural({ min: DAY * minDaysAgo, max: DAY * maxDaysAgo });
  return new Date(Date.now() - ago);
}

function randomAllergies() {
  const amount = chance.natural({ max: 3 });
  return chance.pickset(ALLERGIES, amount).map(allergy => ({
    _id: shortid.generate(),
    allergy,
    practitioner: chance.pick(PRACTITIONERS).value,
    date: randomDate(),
  }));
}

function randomConditions(db) {
  if (!db) return [];
  const amount = chance.natural({ max: 3 });
  return chance.pickset(CONDITIONS, amount).map(condition => ({
    _id: shortid.generate(),
    condition,
    practitioner: chance.pick(PRACTITIONERS).value,
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

export function createDummyVisit(current = false) {
  const endDate = current ? new Date() : randomDate();

  const duration = chance.natural({ min: HOUR, max: HOUR * 10 });
  const startDate = new Date(endDate.getTime() - duration);

  return {
    _id: shortid.generate(),

    visitType: chance.pick(Object.values(VISIT_TYPES)),
    startDate: startDate,
    endDate: current ? undefined : endDate,
    location: chance.pick(LOCATIONS).value,
    examiner: chance.pick(PRACTITIONERS).value,
    reasonForVisit: '',

    vitals: [randomVitals({ dateRecorded: startDate })],
    notes: [],
    procedures: [],
    labs: [],
    imaging: [],
    medications: [],
    documents: [],
    diagnoses: [],
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
    visits: new Array(chance.natural({ max: 5 })).fill(0).map(() => createDummyVisit(false)),
    alerts: [],
    // allergies: randomAllergies(db),
    // conditions: randomConditions(db),
  };
}

export const PATIENTS = new Array(50).fill(0).map(() => createDummyPatient());
