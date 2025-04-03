import { fake } from '@tamanu/fake-data/fake';

export const makeTwoPatients = async (models, overridesKeep = {}, overridesMerge = {}) => {
  const { Patient } = models;
  const keep = await models.Patient.create({
    ...fake(Patient),
    ...overridesKeep,
  });
  const merge = await models.Patient.create({
    ...fake(Patient),
    ...overridesMerge,
  });
  return [keep, merge];
};
