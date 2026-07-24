import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createTestDatabase, closeDatabase } from '../utilities';
import { setFhirRefreshTriggers } from '../../src/services/setFhirRefreshTriggers';

describe('setFhirRefreshTriggers', () => {
  let database;

  beforeAll(async () => {
    database = await createTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('adds fhir_refresh triggers when fhirWorkerEnabled is true', async () => {
    const { sequelize } = database;

    await setFhirRefreshTriggers(sequelize, { fhirWorkerEnabled: true });

    const [rows] = await sequelize.query(`
      SELECT event_object_schema, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name LIKE 'fhir_refresh_%'
      ORDER BY event_object_schema, event_object_table
    `);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.event_object_schema === 'public')).toBe(true);
  });

  it('does not add a fhir_refresh trigger to reference data (or reference-data-like) tables', async () => {
    const { sequelize } = database;

    await setFhirRefreshTriggers(sequelize, { fhirWorkerEnabled: true });

    const [rows] = await sequelize.query(`
      SELECT event_object_table
      FROM information_schema.triggers
      WHERE trigger_name IN (
        'fhir_refresh_reference_data',
        'fhir_refresh_departments',
        'fhir_refresh_locations',
        'fhir_refresh_location_groups',
        'fhir_refresh_lab_test_types',
        'fhir_refresh_lab_test_panels',
        'fhir_refresh_scheduled_vaccines',
        'fhir_refresh_imaging_area_external_codes',
        'fhir_refresh_imaging_type_external_codes'
      )
    `);

    expect(rows.length).toBe(0);
  });

  it('still adds a fhir_refresh trigger to facilities, a resource\'s own primary entity', async () => {
    const { sequelize } = database;

    await setFhirRefreshTriggers(sequelize, { fhirWorkerEnabled: true });

    const [rows] = await sequelize.query(`
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_name = 'fhir_refresh_facilities'
      LIMIT 1
    `);

    expect(rows.length).toBe(1);
  });

  it('removes fhir_refresh triggers when fhirWorkerEnabled is false', async () => {
    const { sequelize } = database;

    await setFhirRefreshTriggers(sequelize, { fhirWorkerEnabled: false });

    const [rows] = await sequelize.query(`
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_name LIKE 'fhir_refresh_%'
      LIMIT 1
    `);

    expect(rows.length).toBe(0);
  });
});
