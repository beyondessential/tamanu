import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { generateEachDataType } from '@tamanu/fake-data/populateDb';

import { createTestContext } from './utilities';

describe('Fake data generation', () => {
  let ctx;
  let models;

  const drugIds = async () => {
    const drugs = await models.ReferenceData.findAll({
      where: { type: REFERENCE_TYPES.DRUG },
      attributes: ['id'],
      raw: true,
    });
    return drugs.map(drug => drug.id);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(async () => ctx.close());

  it('gives every generated drug a reference drug record', async () => {
    const existing = new Set(await drugIds());
    await generateEachDataType(models);
    const generated = (await drugIds()).filter(id => !existing.has(id));
    expect(generated.length).toBeGreaterThan(0);

    const withRecord = await models.ReferenceDrug.count({ where: { referenceDataId: generated } });
    expect(withRecord).toBe(generated.length);
  });
});
