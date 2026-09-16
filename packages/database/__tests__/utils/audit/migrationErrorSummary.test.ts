import { describe, expect, it } from 'vitest';
import { migrationErrorSummary } from '../../../src/utils/audit/migrationErrorSummary';

const databaseError = (fields: Record<string, unknown>) => {
  const original = Object.assign(new Error(fields.message as string), fields);
  return Object.assign(new Error(fields.message as string), {
    name: 'SequelizeDatabaseError',
    original,
    parent: original,
    sql: 'UPDATE patients SET dose_unit_id = $1 WHERE id = $2',
    parameters: { 1: 'unit-mg', 2: 'patient-abc' },
  });
};

describe('migrationErrorSummary', () => {
  it('keeps what a deployment needs to fix the data before retrying', () => {
    const summary = migrationErrorSummary(
      databaseError({
        message: 'duplicate key value violates unique constraint "patients_email_key"',
        code: '23505',
        detail: 'Key (email)=(alice@example.org) already exists.',
        hint: 'Merge the duplicate patient first.',
        table: 'patients',
        column: 'email',
        constraint: 'patients_email_key',
      }),
    );

    expect(summary).toEqual({
      code: '23505',
      message: 'duplicate key value violates unique constraint "patients_email_key"',
      detail: 'Key (email)=(alice@example.org) already exists.',
      hint: 'Merge the duplicate patient first.',
      table: 'patients',
      column: 'email',
      constraint: 'patients_email_key',
    });
  });

  it('leaves out the statement and its parameters', () => {
    const serialised = JSON.stringify(
      migrationErrorSummary(databaseError({ message: 'boom', code: '23505' })),
    );

    expect(serialised).not.toContain('UPDATE patients');
    expect(serialised).not.toContain('patient-abc');
  });

  it('keeps a message written by migration code', () => {
    const summary = migrationErrorSummary(new Error('no dosing unit for reference drug abc'));

    expect(summary).toEqual({
      name: 'Error',
      message: 'no dosing unit for reference drug abc',
    });
  });

  it('reads a postgres error thrown without a sequelize wrapper', () => {
    const summary = migrationErrorSummary(
      Object.assign(new Error('relation "reference_drugs" does not exist'), {
        code: '42P01',
        table: 'reference_drugs',
      }),
    );

    expect(summary).toEqual({
      code: '42P01',
      message: 'relation "reference_drugs" does not exist',
      table: 'reference_drugs',
    });
  });

  it('does not mistake a node error code for a sqlstate', () => {
    const summary = migrationErrorSummary(
      Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:5432'), { code: 'ECONNREFUSED' }),
    );

    expect(summary).toEqual({
      name: 'Error',
      message: 'connect ECONNREFUSED 10.0.0.1:5432',
    });
  });

  it('names what it can when migration code throws something that is not an Error', () => {
    expect(migrationErrorSummary('boom' as never)).toEqual({
      name: 'UnknownError',
      message: 'boom',
    });
    expect(migrationErrorSummary({ nope: true } as never)).toEqual({ name: 'UnknownError' });
  });
});
