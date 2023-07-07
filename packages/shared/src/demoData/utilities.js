import Chance from 'chance';

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

export const splitIds = ids => split(ids).map(s => ({ id: makeId(s), name: s }));
