import Chance from 'chance';
import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;
export const TIME_INTERVALS = {
  HOUR,
  DAY,
};

const chance = new Chance();

export const randomDate = (minDaysAgo = 1, maxDaysAgo = 365) => {
  const ago = chance.natural({ min: DAY * minDaysAgo, max: DAY * maxDaysAgo });
  return new Date(Date.now() - ago);
};

export const randomRecord = (models, modelName) =>
  models[modelName].findOne({
    order: models.ReferenceData.sequelize.random(),
  });

export const randomRecords = (models, modelName, count) =>
  models[modelName].findAll({
    order: models.ReferenceData.sequelize.random(),
    limit: count,
  });

export const randomRecordId = async (models, modelName) => {
  const obj = await randomRecord(models, modelName);
  return (obj || {}).id || null;
};

/**
 * Facility id for demo seed rows (departments, locations, etc.). Uses the first
 * configured server facility when present so defaults align with facility-server
 * tests and API facility context; otherwise a random facility (e.g. central-only).
 */
export const resolveSeedFacilityId = async models => {
  const serverFacilityIds = selectFacilityIds(config);
  const first = serverFacilityIds?.[0];
  if (first) {
    return first;
  }
  return randomRecordId(models, 'Facility');
};

const makeId = (s) =>
  s
    .trim()
    .replace(/\s/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();

const split = (s) =>
  s
    .split(/[\r\n]+/g)
    .map((x) => x.trim())
    .filter((x) => x);

export const splitIds = (ids) => split(ids).map((s) => ({ id: makeId(s), name: s }));
