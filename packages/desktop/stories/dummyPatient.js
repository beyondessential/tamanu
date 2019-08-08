import Chance from 'chance';
import shortid from 'shortid';

const generator = new Chance();

const split = s => s.split(/[\r\n]+/g).map(x => x.trim()).filter(x => x);

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

function randomConditions() {
  const amount = chance.natural({ max: 3});
  return chance.pickset(CONDITIONS, amount);
}

export function createDummyPatient(overrides = {}) {
  const gender = overrides.gender || chance.pick(['male', 'female']);
  return {
    _id: shortid.generate(),
    name: generator.name({ gender }),
    sex: gender,
    dateOfBirth: generator.birthday(),
    visits: [],
    alerts: [],
    allergies: randomAllergies(),
    conditions: randomConditions(),
    ...overrides,
  };
}
