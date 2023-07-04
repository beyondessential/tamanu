import { Sequelize } from 'sequelize';

import { createTestContext } from '../utilities';
import { getPatientLinkedModels } from '../../app/sync/getPatientLinkedModels';

describe('getPatientLinkedModels', () => {
  let ctx;
  let models;
  let filteredModels;
  let filteredModelsKeys;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    filteredModels = getPatientLinkedModels(models);
    filteredModelsKeys = Object.keys(filteredModels);
  });

  afterAll(() => ctx.close());

  it('returns an object containing models', () => {
    expect(typeof filteredModels).toBe('object');

    for (const model of Object.values(filteredModels)) {
      expect(model.prototype instanceof Sequelize.Model).toBe(true);
    }
  });

  it('excludes PatientFacility', () => {
    const hasPatientFacility = filteredModelsKeys.includes('PatientFacility');
    expect(hasPatientFacility).toBe(false);
  });
});
