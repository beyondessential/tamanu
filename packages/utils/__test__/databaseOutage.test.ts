import { describe, expect, it } from 'vitest';
import { isTransientConnectionError } from '../src/databaseOutage';

const namedError = (name: string, extra: object = {}) =>
  Object.assign(new Error(name), { name, ...extra });

describe('isTransientConnectionError', () => {
  it.each([
    ['sequelize connection refused', namedError('SequelizeConnectionRefusedError')],
    ['sequelize host not found', namedError('SequelizeHostNotFoundError')],
    ['raw ECONNREFUSED', Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })],
    ['raw ECONNRESET', Object.assign(new Error('reset'), { code: 'ECONNRESET' })],
    ['admin shutdown', Object.assign(new Error('terminating'), { code: '57P01' })],
    ['starting up', Object.assign(new Error('starting up'), { code: '57P03' })],
    ['connection exception class', Object.assign(new Error('failure'), { code: '08006' })],
    [
      'generic sequelize error wrapping a transient cause',
      namedError('SequelizeConnectionError', { parent: { code: '57P03' } }),
    ],
  ])('treats %s as transient', (_label, error) => {
    expect(isTransientConnectionError(error)).toBe(true);
  });

  it.each([
    ['access denied', namedError('SequelizeAccessDeniedError', { parent: { code: '28P01' } })],
    ['missing database', namedError('SequelizeConnectionError', { parent: { code: '3D000' } })],
    ['unrelated error', new Error('boom')],
    ['non-error', 'ECONNREFUSED'],
    ['null', null],
  ])('does not treat %s as transient', (_label, error) => {
    expect(isTransientConnectionError(error)).toBe(false);
  });
});
