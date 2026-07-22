import { afterEach, describe, expect, it } from 'vitest';
import { pgStartupOptions, resolveDbConfig } from '../../src/services/connectionConfig';

describe('resolveDbConfig', () => {
  const structured = {
    name: 'tamanu-central',
    username: 'tamanu',
    password: 'structured-pass',
    host: 'localhost',
    port: 5432,
    pool: { max: 10 },
    migrateOnStartup: false,
  };

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it('returns the structured config untouched when DATABASE_URL is unset', () => {
    expect(resolveDbConfig(structured)).toEqual(structured);
  });

  it('parses a tcp DATABASE_URL into connection fields', () => {
    process.env.DATABASE_URL = 'postgresql://urluser:urlpass@db.host:6543/urldb';
    const resolved = resolveDbConfig(structured);
    expect(resolved).toMatchObject({
      name: 'urldb',
      username: 'urluser',
      password: 'urlpass',
      host: 'db.host',
      port: 6543,
      migrateOnStartup: false, // non-connection fields preserved
    });
  });

  it('reads pool settings from the query string, merged over structured pool', () => {
    process.env.DATABASE_URL = 'postgresql://u:p@h:5432/db?max=20&min=2&idle=10000';
    const resolved = resolveDbConfig({ ...structured, pool: { max: 10, evict: 1000 } });
    // query overrides max, adds min/idle, keeps structured evict
    expect(resolved.pool).toEqual({ max: 20, min: 2, idle: 10000, evict: 1000 });
  });

  it('supports unix socket urls (host in query, no port)', () => {
    process.env.DATABASE_URL = 'postgresql://tamanu:pass@/tamanu-central?host=/var/run/postgresql';
    const resolved = resolveDbConfig(structured);
    expect(resolved).toMatchObject({
      host: '/var/run/postgresql',
      port: null,
      name: 'tamanu-central',
      username: 'tamanu',
    });
  });

  it('throws a clear error when DATABASE_URL is not a postgres connection string', () => {
    process.env.DATABASE_URL = 'localhost:5432/tamanu';
    expect(() => resolveDbConfig(structured)).toThrow(/postgres/);
  });
});

describe('pgStartupOptions', () => {
  it('returns the GUC flag for a positive millisecond value', () => {
    expect(pgStartupOptions({ idleInTransactionSessionTimeout: 600000 })).toEqual(
      '-c idle_in_transaction_session_timeout=600000',
    );
  });

  it('floors fractional values', () => {
    expect(pgStartupOptions({ idleInTransactionSessionTimeout: 1500.9 })).toEqual(
      '-c idle_in_transaction_session_timeout=1500',
    );
  });

  it('is disabled when unset, zero, negative, or junk', () => {
    expect(pgStartupOptions()).toBeUndefined();
    expect(pgStartupOptions({})).toBeUndefined();
    expect(pgStartupOptions({ idleInTransactionSessionTimeout: 0 })).toBeUndefined();
    expect(pgStartupOptions({ idleInTransactionSessionTimeout: -5 })).toBeUndefined();
    expect(pgStartupOptions({ idleInTransactionSessionTimeout: 'ten minutes' })).toBeUndefined();
  });
});
