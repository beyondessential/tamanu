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

  it('generates records whose dates and amounts agree with each other', async () => {
    for (let round = 0; round < 3; round++) await generateEachDataType(models);
    const { sequelize } = ctx.store;
    const count = async sql => (await sequelize.query(sql, { plain: true })).n;

    expect(await count(`SELECT count(*)::int n FROM encounters WHERE end_date < start_date`)).toBe(
      0,
    );
    expect(
      await count(`SELECT count(*)::int n FROM appointments WHERE end_time <= start_time`),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM lab_requests WHERE sample_time < requested_date`),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM lab_test_types WHERE male_min > male_max`),
    ).toBe(0);
    expect(await count(`SELECT count(*)::int n FROM invoice_discounts WHERE percentage > 1`)).toBe(
      0,
    );
    expect(
      await count(`SELECT count(DISTINCT diagnosis_id)::int n FROM encounter_diagnoses`),
    ).toBeGreaterThan(1);
  });
});
