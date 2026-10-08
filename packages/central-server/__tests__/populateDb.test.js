import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
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

  it('backfills a reference drug record for every pre-existing bare drug', async () => {
    const bareDrugs = await models.ReferenceData.bulkCreate([
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
    ]);
    const bareDrugIds = bareDrugs.map(drug => drug.id);
    expect(await models.ReferenceDrug.count({ where: { referenceDataId: bareDrugIds } })).toBe(0);

    await generateEachDataType(models);

    const allDrugIds = await drugIds();
    expect(allDrugIds).toEqual(expect.arrayContaining(bareDrugIds));
    const withRecord = await models.ReferenceDrug.count({ where: { referenceDataId: allDrugIds } });
    expect(withRecord).toBe(allDrugIds.length);
  });
});
