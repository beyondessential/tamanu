import Chance from 'chance';
import shortid from 'shortid';
import moment from 'moment';

import { visitOptions } from '../app/constants';

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const generator = new Chance();

const makeId = s => s.trim().replace(/\s/g, '-').replace(/\W/g, '').toLowerCase();
const split = s => s.split(/[\r\n]+/g).map(x => x.trim()).filter(x => x);
const splitIds = s => split(s).map(s => ({ label: s, value: makeId(s) }));

export const LOCATIONS = splitIds(`
  Ward 1
  Ward 2
  Ward 3
  Ward 4
  Emergency
`);

export const PRACTITIONERS = splitIds(`
  Dr Philip Rogers
  Dr Salvatore Mathis
  Dr Billy Faulkner
  Dr Davis Morales
  Dr Jacquelyn Kirby
  Dr Evelin Cortez
  Dr Hana Pitts
  Dr Melody Moon
  Dr Aiyana Stewart
  Johnathan Dixon
  Kinley Farmer
  Karla Jenkins
  Mikayla Hull
  Marissa Bautista
`);

const ALLERGIES = split(`
  Penicillin
  Peanuts
  Amoxicillin
  Ampicillin
  Tetracycline
  Aspirin
  Cetuximab
  Rituximab
  Insulin
  Carbamazepine
  Phenytoin
  Atracurium
  Vecuronium
  Abacavir
  Nevirapine
`);

function randomAllergies() {
  const amount = chance.natural({ max: 3});
  return chance.pickset(ALLERGIES, amount);
}

const CONDITIONS = split(`
  Alzheimer
  Amputated left arm
  Anxiety
  Arthritis
  Asthma
  Autism
  Cancer
  Chronic fatigue
  Crohn disease
  Cystic fibrosis
  Depression
  Diabetes type II
  Epilepsy
  Heart murmur
  Migraine
  PTSD
  Stroke
`);


function randomDate(minDaysAgo = 1, maxDaysAgo = 365) {
  const ago = chance.natural({ min: DAY * minDaysAgo, max: DAY * maxDaysAgo });
  return new Date(+new Date() - ago);
}

function randomConditions() {
  const amount = chance.natural({ max: 3});
  return chance.pickset(CONDITIONS, amount).map(condition => ({
    name: condition,
    practitioner: chance.pick(PRACTITIONERS).value,
    date: randomDate(),
  }));
}

function randomVitals(overrides) {
  return {
    dateRecorded: +new Date(),
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
  const startDate = new Date(+endDate - duration);

  return {
    visitType: chance.pick(visitOptions).value,
    startDate: startDate,
    endDate: current ? undefined : new Date(+ new Date),
    location: chance.pick(LOCATIONS).value,
    examiner: chance.pick(PRACTITIONERS).value,
    reasonForVisit: '',

    vitals: [randomVitals({ dateRecorded: startDate })],
    notes: [],
    procedures: [],
    labs: [],
    imaging: [],
    medication: [],
    documents: [],
  };
}

export function createDummyPatient(overrides = {}) {
  const gender = overrides.gender || chance.pick(['male', 'female']);
  return {
    _id: shortid.generate(),
    name: generator.name({ gender }),
    sex: gender,
    dateOfBirth: generator.birthday(),
    visits: [
      createDummyVisit(false),
      createDummyVisit(false),
      createDummyVisit(false),
    ],
    alerts: [],
    allergies: randomAllergies(),
    conditions: randomConditions(),
    ...overrides,
  };
}
