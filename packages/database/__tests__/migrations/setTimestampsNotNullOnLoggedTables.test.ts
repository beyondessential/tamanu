// Drives the real migration runner from the state before the backfill, so NULL timestamps can be
// seeded the way old data carries them and the backfill and NOT NULL tightening are exercised as
// an upgrade.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { QueryTypes } from 'sequelize';
import { log } from '@tamanu/shared/services/logging/log';

import { closeDatabase, initDatabase } from '../utilities';
import { createMigrationInterface } from '../../src/services/migrations/migrations';

const BACKFILL = '1795481786483-backfillNullTimestampsOnLoggedTables';
const SET_NOT_NULL = '1795481787579-setTimestampsNotNullOnLoggedTables';

const TABLES_WITH_NULLABLE_CREATED_AT = [
  'appointments',
  'assets',
  'attachments',
  'certificate_notifications',
  'contributing_death_causes',
  'departments',
  'discharges',
  'document_metadata',
  'facilities',
  'lab_request_logs',
  'locations',
  'patient_additional_data',
  'patient_death_data',
  'patient_facilities',
  'patient_secondary_ids',
  'permissions',
  'report_definition_versions',
  'report_definitions',
  'roles',
  'templates',
  'user_facilities',
];

const TABLES_WITH_NULLABLE_UPDATED_AT_ONLY = [
  'invoice_discounts',
  'invoice_insurance_plan_payments',
  'invoice_item_discounts',
  'invoice_items',
  'invoice_patient_payments',
  'invoice_payments',
  'invoice_products',
  'invoices',
];

const PATIENT_ID = '8f6f7d2e-1c3b-4d6a-9a1e-000000000018';
const PATIENT_FACILITY_ID = `${PATIENT_ID};q18-intact`;
const ORIGINAL_CREATED_AT = '2024-01-01 00:00:00';
const ORIGINAL_UPDATED_AT = '2024-03-01 10:00:00.123456';
const NUDGED_UPDATED_AT = '2024-03-01 10:00:00.123457';

describe('setTimestampsNotNullOnLoggedTables migration', () => {
  let sequelize: any;
  let models: any;
  let umzug: any;
  let baselineExecuted = 0;

  const query = (sql: string, replacements?: Record<string, unknown>) =>
    sequelize.query(sql, { type: QueryTypes.SELECT, replacements }) as Promise<any[]>;

  const nullability = async (table: string) => {
    const rows = await query(
      `SELECT column_name, is_nullable FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = :table
         AND column_name IN ('created_at', 'updated_at')`,
      { table },
    );
    return Object.fromEntries(rows.map(r => [r.column_name, r.is_nullable]));
  };

  // A row with a NULL timestamp can't be committed while the changelog is recording, which is
  // the failure this migration addresses; old rows got there before it, or with it paused.
  const withAuditPaused = (fn: () => Promise<unknown>) =>
    sequelize.transaction(async () => {
      await sequelize.query(`SELECT set_config('tamanu.audit.pause', 'true', true)`);
      await fn();
    });

  const timestamps = async (table: string, id: string) =>
    (
      await query(
        `SELECT (created_at AT TIME ZONE 'UTC')::text AS created_at,
                (updated_at AT TIME ZONE 'UTC')::text AS updated_at
         FROM "${table}" WHERE id = :id`,
        { id },
      )
    )[0];

  beforeAll(async () => {
    ({ sequelize, models } = await initDatabase());
    ({ migrations: umzug } = await createMigrationInterface(log, sequelize));

    const pending = (await umzug.pending()).map((m: any) => m.file);
    const backfillIndex = pending.findIndex((f: string) => f.startsWith(BACKFILL));
    if (backfillIndex < 1) throw new Error('could not find the backfill migration in pending list');

    await umzug.up({ to: pending[backfillIndex - 1] });
    baselineExecuted = (await umzug.executed()).length;

    await withAuditPaused(async () => {
      await sequelize.query(`
        INSERT INTO facilities (id, code, name, created_at, updated_at)
        VALUES ('q18-both-null', 'Q18A', 'Q18 both null', NULL, NULL),
               ('q18-created-null', 'Q18B', 'Q18 created null', NULL, '${ORIGINAL_UPDATED_AT}Z'),
               ('q18-intact', 'Q18C', 'Q18 intact', '${ORIGINAL_CREATED_AT}Z', '${ORIGINAL_UPDATED_AT}Z');
      `);
      await sequelize.query(`
        INSERT INTO patients (id, display_id, first_name, last_name, sex)
        VALUES ('${PATIENT_ID}', 'Q18-PAT', 'Qa', 'Q18', 'other');
      `);
      await sequelize.query(`
        INSERT INTO patient_facilities (patient_id, facility_id, created_at, updated_at)
        VALUES ('${PATIENT_ID}', 'q18-intact', NULL, '${ORIGINAL_UPDATED_AT}Z');
      `);
    });
  }, 900000);

  afterAll(async () => {
    await closeDatabase();
  });

  it('starts with nullable timestamps and the seeded NULLs in place', async () => {
    expect(await nullability('facilities')).toEqual({ created_at: 'YES', updated_at: 'YES' });
    expect(await nullability('invoices')).toEqual({ created_at: 'NO', updated_at: 'YES' });
    expect(await timestamps('facilities', 'q18-both-null')).toEqual({
      created_at: null,
      updated_at: null,
    });
  });

  it('backfills NULL timestamps, keeping a genuine updated_at to the microsecond', async () => {
    await umzug.up({ to: `${BACKFILL}.ts` });

    const bothNull = await timestamps('facilities', 'q18-both-null');
    expect(bothNull.created_at).not.toBeNull();
    expect(bothNull.updated_at).not.toBeNull();

    expect(await timestamps('facilities', 'q18-created-null')).toEqual({
      created_at: ORIGINAL_UPDATED_AT,
      updated_at: NUDGED_UPDATED_AT,
    });
    expect(await timestamps('patient_facilities', PATIENT_FACILITY_ID)).toEqual({
      created_at: ORIGINAL_UPDATED_AT,
      updated_at: NUDGED_UPDATED_AT,
    });
  }, 900000);

  it('leaves rows with both timestamps untouched', async () => {
    expect(await timestamps('facilities', 'q18-intact')).toEqual({
      created_at: ORIGINAL_CREATED_AT,
      updated_at: ORIGINAL_UPDATED_AT,
    });
  });

  it('makes created_at and updated_at NOT NULL on every listed table', async () => {
    await umzug.up({ to: `${SET_NOT_NULL}.ts` });

    for (const table of [
      ...TABLES_WITH_NULLABLE_CREATED_AT,
      ...TABLES_WITH_NULLABLE_UPDATED_AT_ONLY,
    ]) {
      expect({ table, ...(await nullability(table)) }).toEqual({
        table,
        created_at: 'NO',
        updated_at: 'NO',
      });
    }
  }, 900000);

  it('lets a healed row be updated with the changelog recording', async () => {
    // The backfill's own UPDATE already logged this row, so count the entries the test's update
    // adds rather than the entries there are.
    const changelogEntries = async () =>
      (
        await query(
          `SELECT count(*)::int AS count FROM logs.changes
           WHERE table_name = 'patient_facilities' AND record_id = :id`,
          { id: PATIENT_FACILITY_ID },
        )
      )[0].count;

    const before = await changelogEntries();
    await sequelize.transaction(async () => {
      await sequelize.query(`UPDATE patient_facilities SET updated_at = now() WHERE id = :id`, {
        replacements: { id: PATIENT_FACILITY_ID },
      });
    });

    expect(await changelogEntries()).toEqual(before + 1);
  });

  it('refuses an explicit NULL created_at when it is written', async () => {
    await expect(
      sequelize.query(
        `INSERT INTO facilities (id, code, name, created_at) VALUES ('q18-new-null', 'Q18D', 'Q18 new', NULL)`,
      ),
    ).rejects.toThrow(/null value in column "created_at"/);
  });

  it('still fills timestamps on an ORM create and on a raw insert that omits them', async () => {
    const facility = await models.Facility.create({ id: 'q18-orm', code: 'Q18E', name: 'Q18 orm' });
    expect(facility.createdAt).toBeTruthy();

    await sequelize.query(
      `INSERT INTO facilities (id, code, name) VALUES ('q18-raw', 'Q18F', 'Q18 raw')`,
    );
    const raw = await timestamps('facilities', 'q18-raw');
    expect(raw.created_at).not.toBeNull();
    expect(raw.updated_at).not.toBeNull();
  });

  it('restores the earlier nullability on the way down', async () => {
    const executed = (await umzug.executed()).length;
    for (let i = 0; i < executed - baselineExecuted; i++) {
      await umzug.down();
    }

    expect(await nullability('facilities')).toEqual({ created_at: 'YES', updated_at: 'YES' });
    expect(await nullability('invoices')).toEqual({ created_at: 'NO', updated_at: 'YES' });
  }, 900000);

  it('can be upgraded again afterwards', async () => {
    await umzug.up();
    expect(await nullability('facilities')).toEqual({ created_at: 'NO', updated_at: 'NO' });
  }, 900000);
});
