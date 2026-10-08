import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { REFERENCE_TYPES } from '@tamanu/constants';
import {
  generateEachDataType,
  generateFake,
  randomReferenceDataId,
  resetRandomRecordCache,
} from '@tamanu/fake-data/populateDb';

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
    expect(
      await count(
        `SELECT count(*)::int n FROM patients WHERE date_of_death::date < date_of_birth::date`,
      ),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM patient_death_data d JOIN patients p ON p.id = d.patient_id
        WHERE p.sex <> 'female' AND d.was_pregnant IS NOT NULL`),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int n FROM encounters e JOIN patients p ON p.id = e.patient_id
        WHERE p.date_of_death IS NOT NULL AND (e.end_date IS NULL OR e.end_date > p.date_of_death)`,
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int n FROM lab_tests WHERE result <> '' AND completed_date IS NULL`,
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int n FROM lab_requests WHERE published_date::timestamp > now()`,
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int n FROM imaging_results WHERE completed_at::timestamp > now()`,
      ),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM lab_request_logs l JOIN lab_requests r ON r.id = l.lab_request_id
        WHERE l.status <> r.status`),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM encounter_pause_prescription_histories`),
    ).toBeGreaterThan(0);
    expect(
      await count(`SELECT count(*)::int n FROM patient_death_data d JOIN patients p ON p.id = d.patient_id
        WHERE d.hours_survived_since_birth IS NOT NULL OR (d.birth_weight IS NOT NULL
          AND p.date_of_death::date - p.date_of_birth::date >= 365)`),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM appointments
        WHERE extract(hour FROM start_time::timestamp) NOT BETWEEN 8 AND 16`),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM tasks WHERE completed_time::timestamp > now()`),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM encounters WHERE end_date::timestamp > now()`),
    ).toBe(0);
    expect(
      await count(`SELECT count(*)::int n FROM (SELECT encounter_prescription_id FROM encounter_pause_prescription_histories
        GROUP BY encounter_prescription_id HAVING count(*) > 1) dup`),
    ).toBe(0);
  });

  it('grows a reference data pool without repeating names under concurrent calls', async () => {
    resetRandomRecordCache();
    await Promise.all(
      Array.from({ length: 10 }, () => randomReferenceDataId(models, REFERENCE_TYPES.DIET)),
    );
    const diets = await models.ReferenceData.findAll({
      where: { type: REFERENCE_TYPES.DIET },
      attributes: ['name'],
      raw: true,
    });
    expect(new Set(diets.map(({ name }) => name)).size).toBe(diets.length);
  });

  it('rolls back a failed round', async () => {
    const before = await models.Patient.count();
    const create = vi.spyOn(models.Invoice, 'create').mockRejectedValue(new Error('boom'));
    try {
      await expect(generateFake(models, 1)).rejects.toThrow('too many errors');
    } finally {
      create.mockRestore();
    }
    expect(await models.Patient.count()).toBe(before);
  });
});
