import Chance from 'chance';

import { generateId } from '../utils/generateId';
import { VISIT_TYPES } from '../constants';

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

export async function randomUser(models) {
  const obj = await models.User.findOne({
    order: models.ReferenceData.sequelize.random(),
  });
  return obj.id;
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

function randomVitals(overrides) {
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

export async function createDummyVisit(models, { current, ...overrides } = {}) {
  const endDate = current ? new Date() : randomDate();

  const duration = chance.natural({ min: HOUR, max: HOUR * 10 });
  const startDate = new Date(endDate.getTime() - duration);

  return {
    visitType: chance.pick(Object.values(VISIT_TYPES)),
    startDate: startDate,
    endDate: current ? undefined : endDate,
    reasonForVisit: chance.sentence({ words: chance.integer({ min: 4, max: 8 }) }),
    locationId: await randomReferenceId(models, 'location'),
    departmentId: await randomReferenceId(models, 'department'),
    examinerId: await randomUser(models),
    ...overrides,
  };
}

export async function createDummyPatient(models, overrides = {}) {
  const gender = overrides.sex || chance.pick(['male', 'female']);
  return {
    displayId: generateId(),
    firstName: chance.first({ gender }),
    lastName: chance.last(),
    culturalName: chance.last(),
    sex: chance.bool({ likelihood: 5 }) ? 'other' : gender,
    dateOfBirth: chance.birthday(),
    ...overrides,
  };
}
