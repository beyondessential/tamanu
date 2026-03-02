import { fake } from '@tamanu/fake-data/fake';

import { checkUserUniqueness } from '../../dist/admin/userValidation';
import { validateTableRows } from '../../dist/admin/importer/validateTableRows';
import { createTestContext } from '../utilities';

jest.setTimeout(30000);

describe('checkUserUniqueness', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  it('returns no dupes when no conflicts exist', async () => {
    const result = await checkUserUniqueness(models.User, {
      email: `unique-${Date.now()}@example.com`,
      displayName: `Unique User ${Date.now()}`,
    });
    expect(result.email).toBeFalsy();
    expect(result.displayName).toBeFalsy();
  });

  it('detects duplicate email', async () => {
    const existing = await models.User.create(fake(models.User));

    const result = await checkUserUniqueness(models.User, {
      email: existing.email,
      displayName: `No Conflict ${Date.now()}`,
    });
    expect(result.email).toBe(true);
    expect(result.displayName).toBeFalsy();
  });

  it('detects duplicate displayName case-insensitively', async () => {
    const existing = await models.User.create(fake(models.User));

    const result = await checkUserUniqueness(models.User, {
      email: `no-conflict-${Date.now()}@example.com`,
      displayName: existing.displayName.toUpperCase(),
    });
    expect(result.email).toBeFalsy();
    expect(result.displayName).toBe(true);
  });

  it('excludes the current user when excludeId is provided', async () => {
    const existing = await models.User.create(fake(models.User));

    const result = await checkUserUniqueness(models.User, {
      email: existing.email,
      displayName: existing.displayName,
      excludeId: existing.id,
    });
    expect(result.email).toBeFalsy();
    expect(result.displayName).toBeFalsy();
  });

  it('still detects conflicts with other users when excludeId is provided', async () => {
    const userA = await models.User.create(fake(models.User));
    const userB = await models.User.create(fake(models.User));

    const result = await checkUserUniqueness(models.User, {
      email: userA.email,
      displayName: userA.displayName,
      excludeId: userB.id,
    });
    expect(result.email).toBe(true);
    expect(result.displayName).toBe(true);
  });

  it('skips checks for undefined fields', async () => {
    const result = await checkUserUniqueness(models.User, {});
    expect(result.email).toBeUndefined();
    expect(result.displayName).toBeUndefined();
  });
});

describe('validateTableRows - User batch validation', () => {
  const makeRow = (email, displayName, sheetRow = 2) => ({
    model: 'User',
    values: { email, displayName },
    sheetRow,
  });

  it('passes with unique emails and display names', async () => {
    const errors = [];
    const pushErrorFn = (_model, _row, msg) => errors.push(msg);

    await validateTableRows({}, [
      makeRow('a@example.com', 'Alice', 2),
      makeRow('b@example.com', 'Bob', 3),
    ], pushErrorFn);

    expect(errors).toHaveLength(0);
  });

  it('detects duplicate emails within batch', async () => {
    const errors = [];
    const pushErrorFn = (_model, _row, msg) => errors.push(msg);

    await validateTableRows({}, [
      makeRow('same@example.com', 'Alice', 2),
      makeRow('same@example.com', 'Bob', 3),
    ], pushErrorFn);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Duplicate email/);
  });

  it('detects duplicate display names within batch case-insensitively', async () => {
    const errors = [];
    const pushErrorFn = (_model, _row, msg) => errors.push(msg);

    await validateTableRows({}, [
      makeRow('a@example.com', 'Alice Smith', 2),
      makeRow('b@example.com', 'alice smith', 3),
    ], pushErrorFn);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Duplicate display name/);
  });

  it('detects both duplicate email and display name', async () => {
    const errors = [];
    const pushErrorFn = (_model, _row, msg) => errors.push(msg);

    await validateTableRows({}, [
      makeRow('same@example.com', 'Same Name', 2),
      makeRow('same@example.com', 'Same Name', 3),
    ], pushErrorFn);

    expect(errors).toHaveLength(2);
  });
});
