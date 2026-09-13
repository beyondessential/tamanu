import { describe, expect, it } from 'vitest';
import { sanitiseMigrationError } from '../../../src/utils/audit/sanitiseMigrationError';

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

describe('sanitiseMigrationError', () => {
  it('keeps the identifiers of a database error and none of its row contents', () => {
    const summary = sanitiseMigrationError(
      databaseError({
        message: 'duplicate key value violates unique constraint "patients_email_key"',
        code: '23505',
        detail: 'Key (email)=(alice@example.org) already exists.',
        hint: 'Merge the duplicate patient first.',
        where: 'PL/pgSQL function audit_trigger() line 12',
        internalQuery: 'SELECT 1 FROM patients WHERE email = $1',
        table: 'patients',
        column: 'email',
        constraint: 'patients_email_key',
      }),
    );

    expect(summary).toEqual({
      code: '23505',
      message: 'duplicate key value violates unique constraint "…"',
      table: 'patients',
      column: 'email',
      constraint: 'patients_email_key',
    });

    const serialised = JSON.stringify(summary);
    expect(serialised).not.toContain('alice@example.org');
    expect(serialised).not.toContain('Key (email)');
    expect(serialised).not.toContain('Merge the duplicate patient');
    expect(serialised).not.toContain('audit_trigger');
    expect(serialised).not.toContain('SELECT 1 FROM patients');
    expect(serialised).not.toContain('UPDATE patients');
    expect(serialised).not.toContain('patient-abc');
  });

  it('blanks double- and single-quoted literals in the message', () => {
    const summary = sanitiseMigrationError(
      databaseError({
        message: 'invalid input syntax for type integer: "abc", array element \'250 mg\' rejected',
        code: '22P02',
      }),
    );

    expect(summary.message).toBe(
      'invalid input syntax for type integer: "…", array element \'…\' rejected',
    );
  });

  it('caps a database message at 500 characters', () => {
    const summary = sanitiseMigrationError(
      databaseError({ message: 'x'.repeat(900), code: '42601' }),
    );

    expect(summary.message).toHaveLength(500);
  });

  it('keeps only the class of an error thrown by migration code', () => {
    // A migration author's own message is arbitrary prose, so none of it is copied.
    const summary = sanitiseMigrationError(
      new Error('Patient alice@example.org already has a dosing unit'),
    );
    expect(summary).toEqual({ name: 'Error' });
  });

  it('keeps an engine-written message, which names identifiers rather than values', () => {
    const summary = sanitiseMigrationError(
      new TypeError("Cannot read properties of undefined (reading 'units')"),
    );

    expect(summary).toEqual({
      name: 'TypeError',
      message: "Cannot read properties of undefined (reading '…')",
    });
  });

  it('reads a postgres error thrown without a sequelize wrapper', () => {
    const summary = sanitiseMigrationError(
      Object.assign(new Error('relation "reference_drugs" does not exist'), {
        code: '42P01',
        table: 'reference_drugs',
      }),
    );

    expect(summary).toEqual({
      code: '42P01',
      message: 'relation "…" does not exist',
      table: 'reference_drugs',
    });
  });

  it('does not mistake a node error code for a sqlstate', () => {
    const summary = sanitiseMigrationError(
      Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:5432'), { code: 'ECONNREFUSED' }),
    );

    expect(summary).toEqual({ name: 'Error' });
  });

  it('truncates on a character boundary', () => {
    const summary = sanitiseMigrationError(
      databaseError({ message: '\u{1F600}'.repeat(600), code: '42601' }),
    );

    // A codepoint cut in half would leave a lone surrogate here.
    expect(summary.message).toBe('\u{1F600}'.repeat(500));
  });

  it('names what it can when migration code throws something that is not an Error', () => {
    expect(sanitiseMigrationError('boom' as never)).toEqual({ name: 'UnknownError' });
    expect(sanitiseMigrationError({ nope: true } as never)).toEqual({ name: 'UnknownError' });
  });
});
