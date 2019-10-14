import Chance from 'chance';
import shortid from 'shortid';

import { VISIT_TYPES } from '../constants';
import { generateId } from './generateId';

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const chance = new Chance();

const makeId = s =>
  s
    .trim()
    .replace(/\s/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
const split = s =>
  s
    .split(/[\r\n]+/g)
    .map(x => x.trim())
    .filter(x => x);
const splitIds = ids => split(ids).map(s => ({ _id: makeId(s), name: s }));
const mapToSuggestions = objects => objects.map(({ _id, name }) => ({ label: name, value: _id }));

export const LOCATIONS = splitIds(`
  Ward 1
  Ward 2
  Ward 3
  Ward 4
  Emergency
`);

export const LOCATION_SUGGESTIONS = mapToSuggestions(LOCATIONS);

const buildUser = u => ({
  ...u,
  displayName: u.name,
  email: `${u._id}@xyz.com`,
});
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
`).map(buildUser);

export const PRACTITIONER_SUGGESTIONS = mapToSuggestions(PRACTITIONERS);

export const FACILITIES = splitIds(`
  Balwyn
  Hawthorn East
  Kerang
  Lake Charm
  Marla
  Mont Albert
  National Medical
  Port Douglas
  Swan Hill
  Thornbury
  Traralgon
`);

export const FACILITY_SUGGESTIONS = mapToSuggestions(FACILITIES);

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

export const DIAGNOSES = splitIds(`
  Cold
  Flu
  Gastro
  Injury
`);

export const DIAGNOSIS_SUGGESTIONS = mapToSuggestions(DIAGNOSES);

export const DRUGS = splitIds(`
  Hydrocodone
  Simvastatin
  Lisinopril
  Levothyroxine
  Amlodipine besylate
  Omeprazole
  Azithromycin
  Amoxicillin
  Metformin
  Hydrochlorothiazide
`);

export const DRUG_SUGGESTIONS = mapToSuggestions(DRUGS);

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
  return new Date(Date.now() - ago);
}

export function randomAllergies() {
  const amount = chance.natural({ max: 3 });
  return chance.pickset(ALLERGIES, amount).map(allergy => ({
    _id: shortid.generate(),
    name: allergy,
    practitioner: chance.pick(PRACTITIONERS).value,
    date: randomDate(),
  }));
}

export function randomConditions() {
  const amount = chance.natural({ max: 3 });
  return chance.pickset(CONDITIONS, amount).map(condition => ({
    _id: shortid.generate(),
    condition,
    practitioner: chance.pick(PRACTITIONERS).value,
    date: randomDate(),
  }));
}

export function randomVitals(overrides) {
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

export function createDummyPatient(overrides = {}) {
  const gender = overrides.gender || chance.pick(['male', 'female']);
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
    allergies: [],
    conditions: [],
    ...overrides,
  };
}

export const PATIENTS = new Array(50).fill(0).map(() => createDummyPatient());
