// Drives the real migration runner from the pre-rename state, so the rename is exercised as an
// upgrade rather than as the end state a fresh database happens to land in — which is the only
// way the data-preservation and rollback behaviour can be seen at all.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { QueryTypes } from 'sequelize';
import { log } from '@tamanu/shared/services/logging/log';

import { closeDatabase, initDatabase } from '../utilities';
import { createMigrationInterface } from '../../src/services/migrations/migrations';

const COLUMN_RENAME = '1793218723947-renameInsurerPaymentInsurerId';

describe('renameInvoiceInsurerPaymentTable migration', () => {
  let sequelize: any;
  let umzug: any;
  let baselineExecuted = 0;
  const seeded: Record<string, string> = {};

  const query = (sql: string, replacements?: Record<string, unknown>) =>
    sequelize.query(sql, { type: QueryTypes.SELECT, replacements }) as Promise<any[]>;

  const tableExists = async (name: string) =>
    (
      await query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables
           WHERE table_schema='public' AND table_name=:name) AS "exists"`,
        { name },
      )
    )[0].exists;

  const columnExists = async (table: string, column: string) =>
    (
      await query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_name=:table AND column_name=:column) AS "exists"`,
        { table, column },
      )
    )[0].exists;

  beforeAll(async () => {
    ({ sequelize } = await initDatabase());
    ({ migrations: umzug } = await createMigrationInterface(log, sequelize));

    const pending = (await umzug.pending()).map((m: any) => m.file);
    const renameIndex = pending.findIndex((f: string) => f.startsWith(COLUMN_RENAME));
    if (renameIndex < 1) throw new Error('could not find the rename migration in pending list');

    // stop on the migration immediately before the rename: the state a deployment upgrades from
    await umzug.up({ to: pending[renameIndex - 1] });
    baselineExecuted = (await umzug.executed()).length;
  }, 900000);

  afterAll(async () => {
    await closeDatabase();
  });

  it('starts from the pre-rename schema', async () => {
    expect(await tableExists('invoice_insurer_payments')).toBe(true);
    expect(await columnExists('invoice_insurer_payments', 'insurer_id')).toBe(true);
    expect(await columnExists('invoices', 'insurer_payment_status')).toBe(true);
  });

  it('seeds an insurer payment the way the old importer would have', async () => {
    const one = async (sql: string, replacements?: Record<string, unknown>) =>
      (await query(sql, replacements))[0];

    const patient = await one(`INSERT INTO patients (id, display_id, first_name, last_name, sex)
      VALUES (gen_random_uuid(), 'QA-RN1836', 'Qa', 'Rn1836', 'other') RETURNING id`);
    const facility = await one(`INSERT INTO facilities (id, code, name)
      VALUES ('qa-rn1836-fac', 'QA1836', 'QA 1836') RETURNING id`);
    const department = await one(
      `INSERT INTO departments (id, code, name, facility_id)
       VALUES ('qa-rn1836-dep', 'QA1836', 'QA 1836', :facilityId) RETURNING id`,
      { facilityId: facility.id },
    );
    const locationGroup = await one(
      `INSERT INTO location_groups (id, code, name, facility_id)
       VALUES ('qa-rn1836-lg', 'QA1836', 'QA 1836', :facilityId) RETURNING id`,
      { facilityId: facility.id },
    );
    const location = await one(
      `INSERT INTO locations (id, code, name, facility_id, location_group_id)
       VALUES ('qa-rn1836-loc', 'QA1836', 'QA 1836', :facilityId, :locationGroupId) RETURNING id`,
      { facilityId: facility.id, locationGroupId: locationGroup.id },
    );
    const encounter = await one(
      `INSERT INTO encounters (id, encounter_type, start_date, patient_id, department_id, location_id)
       VALUES (gen_random_uuid(), 'clinic', '2024-01-01 00:00:00', :patientId, :departmentId, :locationId)
       RETURNING id`,
      { patientId: patient.id, departmentId: department.id, locationId: location.id },
    );
    const invoice = await one(
      `INSERT INTO invoices (id, display_id, date, status, encounter_id, insurer_payment_status)
       VALUES (gen_random_uuid(), 'QA-INV-1836', '2024-01-01', 'finalised', :encounterId, 'partial')
       RETURNING id`,
      { encounterId: encounter.id },
    );
    // the insurer as it was: a reference_data row of type 'insurer'
    const insurer = await one(`INSERT INTO reference_data (id, code, type, name)
      VALUES ('ref-insurer-qa-1836', 'QA1836', 'insurer', 'QA Legacy Insurer') RETURNING id`);
    const payment = await one(
      `INSERT INTO invoice_payments (id, invoice_id, date, receipt_number, amount)
       VALUES (gen_random_uuid(), :invoiceId, '2024-01-15', 'QALEGACY', 40) RETURNING id`,
      { invoiceId: invoice.id },
    );
    const insurerPayment = await one(
      `INSERT INTO invoice_insurer_payments (id, invoice_payment_id, insurer_id, status, reason)
       VALUES (gen_random_uuid(), :paymentId, :insurerId, 'partial', 'QA legacy row') RETURNING id`,
      { paymentId: payment.id, insurerId: insurer.id },
    );

    Object.assign(seeded, {
      invoiceId: invoice.id,
      insurerId: insurer.id,
      insurerPaymentId: insurerPayment.id,
    });
    expect(seeded.insurerPaymentId).toBeTruthy();
  });

  it('renames the table and columns and keeps every row', async () => {
    await umzug.up();

    expect(await tableExists('invoice_insurer_payments')).toBe(false);
    expect(await tableExists('invoice_insurance_plan_payments')).toBe(true);
    expect(await columnExists('invoice_insurance_plan_payments', 'invoice_insurance_plan_id')).toBe(
      true,
    );
    expect(await columnExists('invoice_insurance_plan_payments', 'insurer_id')).toBe(false);
    expect(await columnExists('invoices', 'insurance_plan_payment_status')).toBe(true);
    expect(await columnExists('invoices', 'insurer_payment_status')).toBe(false);

    const [row] = await query(
      `SELECT invoice_insurance_plan_id, status, reason
       FROM invoice_insurance_plan_payments WHERE id = :id`,
      { id: seeded.insurerPaymentId },
    );
    expect(row).toMatchObject({
      invoice_insurance_plan_id: seeded.insurerId,
      status: 'partial',
      reason: 'QA legacy row',
    });

    const [invoice] = await query(
      `SELECT insurance_plan_payment_status FROM invoices WHERE id = :id`,
      { id: seeded.invoiceId },
    );
    expect(invoice.insurance_plan_payment_status).toEqual('partial');

    const triggers = (
      await query(
        `SELECT tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
         WHERE c.relname = :table AND NOT t.tgisinternal ORDER BY tgname`,
        { table: 'invoice_insurance_plan_payments' },
      )
    ).map(r => r.tgname);
    expect(triggers.join(',')).toContain('invoice_insurance_plan_payments');
  }, 900000);

  it('leaves no sync_lookup rows under the old table name', async () => {
    const [{ count }] = await query(
      `SELECT count(*)::int AS count FROM sync_lookup WHERE record_type = 'invoice_insurer_payments'`,
    );
    expect(count).toEqual(0);
  });

  it('carries the old insurer id over, matching no insurance plan', async () => {
    const [{ count }] = await query(
      `SELECT count(*)::int AS count FROM invoice_insurance_plan_payments p
       LEFT JOIN invoice_insurance_plans ip ON ip.id = p.invoice_insurance_plan_id
       WHERE p.id = :id AND ip.id IS NULL`,
      { id: seeded.insurerPaymentId },
    );
    expect(count).toEqual(1);
  });

  it('restores the old names with the data intact on the way down', async () => {
    const executed = (await umzug.executed()).length;
    for (let i = 0; i < executed - baselineExecuted; i++) {
      await umzug.down();
    }

    expect(await tableExists('invoice_insurer_payments')).toBe(true);
    expect(await columnExists('invoice_insurer_payments', 'insurer_id')).toBe(true);
    expect(await columnExists('invoices', 'insurer_payment_status')).toBe(true);

    const [row] = await query(
      `SELECT insurer_id, status FROM invoice_insurer_payments WHERE id = :id`,
      { id: seeded.insurerPaymentId },
    );
    expect(row).toMatchObject({ insurer_id: seeded.insurerId, status: 'partial' });
  }, 900000);

  it('can be upgraded again afterwards', async () => {
    await umzug.up();
    expect(await tableExists('invoice_insurance_plan_payments')).toBe(true);
  }, 900000);
});
