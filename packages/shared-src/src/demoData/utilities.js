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

export const randomRecordId = async (models, modelName) => {
  const obj = await models[modelName].findOne({
    order: models.ReferenceData.sequelize.random(),
  });
  return obj?.id ?? null;
};
