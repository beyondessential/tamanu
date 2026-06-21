import { afterEach, describe, expect, it } from 'vitest';
import { resolveDbConfig } from '../../src/services/connectionConfig';

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

  it('returns the structured config untouched when no url is set', () => {
    expect(resolveDbConfig(structured)).toEqual(structured);
  });

  it('parses a tcp url into connection fields', () => {
    const resolved = resolveDbConfig({
      ...structured,
      url: 'postgresql://urluser:urlpass@db.host:6543/urldb',
    });
    expect(resolved).toMatchObject({
      name: 'urldb',
      username: 'urluser',
      password: 'urlpass',
      host: 'db.host',
      port: 6543,
      migrateOnStartup: false, // non-connection fields preserved
    });
    expect(resolved.url).toBeUndefined();
  });

  it('reads pool settings from the query string, merged over structured pool', () => {
    const resolved = resolveDbConfig({
      ...structured,
      pool: { max: 10, evict: 1000 },
      url: 'postgresql://u:p@h:5432/db?max=20&min=2&idle=10000',
    });
    // query overrides max, adds min/idle, keeps structured evict
    expect(resolved.pool).toEqual({ max: 20, min: 2, idle: 10000, evict: 1000 });
  });

  it('supports unix socket urls (host in query, no port)', () => {
    const resolved = resolveDbConfig({
      ...structured,
      url: 'postgresql://tamanu:pass@/tamanu-central?host=/var/run/postgresql',
    });
    expect(resolved).toMatchObject({
      host: '/var/run/postgresql',
      port: null,
      name: 'tamanu-central',
      username: 'tamanu',
    });
  });

  it('prefers the DATABASE_URL env var over the config url', () => {
    process.env.DATABASE_URL = 'postgresql://envuser:envpass@envhost:5432/envdb';
    const resolved = resolveDbConfig({
      ...structured,
      url: 'postgresql://configuser:configpass@confighost:5432/configdb',
    });
    expect(resolved).toMatchObject({
      username: 'envuser',
      host: 'envhost',
      name: 'envdb',
    });
  });
});
