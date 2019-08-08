import Chance from 'chance';
import shortid from 'shortid';

const generator = new Chance();

function randomAllergy() {
  return `Allergy ${Math.floor(Math.random() * 100)}`;
}

function randomAllergies() {
  return (new Array(Math.floor(Math.random() * 3))).fill(0)
    .map(randomAllergy);
}

function randomCondition() {
  return `Condition ${Math.floor(Math.random() * 100)}`;
}

function randomConditions() {
  return (new Array(Math.floor(Math.random() * 3))).fill(0)
    .map(randomCondition);
}

export function createDummyPatient(overrides = {}) {
  const gender = overrides.gender || ((Math.random() < 0.5) ? 'male' : 'female');
  return {
    _id: shortid.generate(),
    name: generator.name({ gender }),
    sex: gender,
    dateOfBirth: generator.birthday(),
    visits: [],
    allergies: randomAllergies(),
    conditions: randomConditions(),
    ...overrides,
  };
}
