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

  it('adds fhir_refresh triggers when triggersEnabled is true', async () => {
    const { sequelize } = database;

    await setFhirRefreshTriggers(sequelize, { triggersEnabled: true });

    const [rows] = await sequelize.query(`
      SELECT event_object_schema, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name LIKE 'fhir_refresh_%'
      ORDER BY event_object_schema, event_object_table
    `);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.event_object_schema === 'public')).toBe(true);
  });

  it('removes fhir_refresh triggers when triggersEnabled is false', async () => {
    const { sequelize } = database;

    await setFhirRefreshTriggers(sequelize, { triggersEnabled: false });

    const [rows] = await sequelize.query(`
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_name LIKE 'fhir_refresh_%'
      LIMIT 1
    `);

    expect(rows.length).toBe(0);
  });
});
