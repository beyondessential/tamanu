import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const keyFile = vi.hoisted(() => ({ path: '', settingsPsk: undefined as string | undefined }));

vi.mock('config', () => ({
  default: {
    get: (name: string) => (name === 'crypto.keyFile' ? keyFile.path : undefined),
    get crypto() {
      return { keyFile: keyFile.path, settingsPsk: keyFile.settingsPsk };
    },
  },
}));

import { checkConfigKey } from '../src/checkConfigKey.js';
import {
  decryptSecret,
  encryptSecret,
  PUBLISHED_DEVELOPMENT_KEY,
} from '@tamanu/shared/utils/crypto';

type Row = { id?: string; key: string; value: string | null };

const fakeSequelize = (tables: Record<string, Row[]>, { hasForgetFunction = false } = {}) =>
  ({
    transaction: vi.fn(async (_options: unknown, fn: () => Promise<unknown>) => fn()),
    query: vi.fn(async (sql: string, options?: any) => {
      if (sql.startsWith('UPDATE')) return [];
      if (sql.includes('to_regprocedure')) {
        return [{ name: hasForgetFunction ? 'forget_server_identity()' : null }];
      }
      if (sql.includes('to_regclass')) {
        const table = options.bind.table.replace('public.', '');
        return [{ name: tables[table] ? table : null }];
      }
      const table = Object.keys(tables).find(name => sql.includes(`public.${name}`));
      return table ? tables[table] : [];
    }),
  }) as any;

const ENCRYPTED = 'S1:aXYtYnl0ZXM=:Y2lwaGVydGV4dA==';

describe('checkConfigKey', () => {
  let dir: string;
  let missing: string;
  let readable: string;

  beforeAll(async () => {
    dir = await fs.mkdtemp(join(tmpdir(), 'tamanu-config-key-'));
    missing = join(dir, 'missing.key');
    await fs.writeFile(join(dir, 'present.key'), new Uint8Array(32));
    await fs.writeFile(join(dir, 'other.key'), new Uint8Array(32).fill(1));
    readable = await encryptSecret(Buffer.alloc(32), 'a-secret');
    keyFile.path = missing;
  });

  afterAll(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('passes when neither table exists', async () => {
    await expect(checkConfigKey(fakeSequelize({}))).resolves.toBeUndefined();
  });

  it('passes when no stored value is encrypted', async () => {
    const sequelize = fakeSequelize({
      local_system_secrets: [{ key: 'syncPassword', value: 'plaintext' }],
      local_system_facts: [{ key: 'currentSyncTick', value: '42' }],
    });
    await expect(checkConfigKey(sequelize)).resolves.toBeUndefined();
  });

  it('passes when the key file decrypts a stored secret', async () => {
    keyFile.path = join(dir, 'present.key');
    const sequelize = fakeSequelize({
      local_system_secrets: [{ key: 'deviceKey', value: readable }],
    });
    await expect(checkConfigKey(sequelize)).resolves.toBeUndefined();
    keyFile.path = missing;
  });

  it('names the mismatch when the key file belongs to another deployment', async () => {
    keyFile.path = join(dir, 'other.key');
    const sequelize = fakeSequelize(
      { local_system_secrets: [{ key: 'deviceKey', value: readable }] },
      { hasForgetFunction: true },
    );

    const error = await checkConfigKey(sequelize).catch((err: Error) => err);
    keyFile.path = missing;
    expect(error).toBeInstanceOf(Error);
    const { message } = error as Error;
    expect(message).toContain('does not decrypt');
    expect(message).toContain('restored from another deployment');
    expect(message).toContain('forget_server_identity()');
    expect(message).not.toContain('deviceKey');
  });

  it('spells out what to delete on a copy from before forget_server_identity()', async () => {
    keyFile.path = join(dir, 'other.key');
    const sequelize = fakeSequelize({
      local_system_secrets: [{ key: 'deviceKey', value: readable }],
    });

    const error = await checkConfigKey(sequelize).catch((err: Error) => err);
    keyFile.path = missing;
    const { message } = error as Error;
    expect(message).not.toContain('forget_server_identity()');
    expect(message).toContain('every row of local_system_secrets');
    expect(message).toContain('syncHost');
  });

  it('names the path and the config key when the key file is missing', async () => {
    const sequelize = fakeSequelize({
      local_system_secrets: [{ key: 'deviceKey', value: ENCRYPTED }],
    });

    const error = await checkConfigKey(sequelize).catch((err: Error) => err);
    expect(error).toBeInstanceOf(Error);
    const { message } = error as Error;
    expect(message).toContain(missing);
    expect(message).toContain('crypto.keyFile');
    expect(message).toContain('mounted');
    expect(message).not.toContain('deviceKey');
  });

  it('re-encrypts secrets held under the published development key with the configured key', async () => {
    keyFile.path = join(dir, 'present.key');
    const sequelize = fakeSequelize({
      local_system_secrets: [
        { id: 'a', key: 'deviceKey', value: await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'one') },
        {
          id: 'b',
          key: 'syncPassword',
          value: await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'two'),
        },
      ],
      local_system_facts: [
        { id: 'c', key: 'legacy', value: await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'three') },
      ],
    });

    await checkConfigKey(sequelize);
    keyFile.path = missing;

    const updates = sequelize.query.mock.calls.filter(([sql]: [string]) =>
      sql.startsWith('UPDATE'),
    );
    expect(sequelize.transaction).toHaveBeenCalledOnce();
    const rewritten = await Promise.all(
      updates.map(async ([sql, { bind }]: [string, { bind: { id: string; value: string } }]) => [
        sql.includes('local_system_facts') ? 'facts' : 'secrets',
        bind.id,
        await decryptSecret(Buffer.alloc(32), bind.value),
      ]),
    );
    expect(rewritten).toEqual([
      ['secrets', 'a', 'one'],
      ['secrets', 'b', 'two'],
      ['facts', 'c', 'three'],
    ]);
  });

  it('re-encrypts a secret under the published development key behind one the configured key reads', async () => {
    keyFile.path = join(dir, 'present.key');
    const sequelize = fakeSequelize({
      local_system_secrets: [
        { id: 'a', key: 'deviceKey', value: readable },
        {
          id: 'b',
          key: 'syncPassword',
          value: await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'two'),
        },
      ],
    });

    await checkConfigKey(sequelize);
    keyFile.path = missing;

    const updates = sequelize.query.mock.calls.filter(([sql]: [string]) =>
      sql.startsWith('UPDATE'),
    );
    expect(updates.map(([, { bind }]: [string, { bind: { id: string } }]) => bind.id)).toEqual([
      'b',
    ]);
  });

  it('gives the copy advice, rewriting nothing, when a secret is under neither key', async () => {
    keyFile.path = join(dir, 'present.key');
    const sequelize = fakeSequelize(
      {
        local_system_secrets: [
          {
            id: 'a',
            key: 'deviceKey',
            value: await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'one'),
          },
          {
            id: 'b',
            key: 'syncPassword',
            value: await encryptSecret(Buffer.alloc(32, 2), 'two'),
          },
        ],
      },
      { hasForgetFunction: true },
    );

    const error = await checkConfigKey(sequelize).catch((err: Error) => err);
    keyFile.path = missing;
    expect((error as Error).message).toContain('forget_server_identity()');
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('refuses the published development key as the configured key in production', async () => {
    const developmentKeyPath = join(dir, 'development.key');
    await fs.writeFile(developmentKeyPath, PUBLISHED_DEVELOPMENT_KEY);
    vi.stubEnv('NODE_ENV', 'production');
    keyFile.path = developmentKeyPath;
    const sequelize = fakeSequelize({
      local_system_secrets: [
        { id: 'a', key: 'deviceKey', value: await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'one') },
      ],
    });

    const error = await checkConfigKey(sequelize).catch((err: Error) => err);
    vi.unstubAllEnvs();
    keyFile.path = missing;
    expect((error as Error).message).toContain('development key published');
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('says how to move off the development key when no key file is present', async () => {
    const sequelize = fakeSequelize({
      local_system_secrets: [
        { id: 'a', key: 'deviceKey', value: await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'one') },
      ],
    });

    const error = await checkConfigKey(sequelize).catch((err: Error) => err);
    const { message } = error as Error;
    expect(message).toContain(missing);
    expect(message).toContain('development key published');
    expect(message).toContain('CRYPTO_KEY_FILE');
  });

  it('names config values still encrypted with the published development key', async () => {
    keyFile.path = join(dir, 'present.key');
    keyFile.settingsPsk = await encryptSecret(PUBLISHED_DEVELOPMENT_KEY, 'ab'.repeat(32));

    const error = await checkConfigKey(fakeSequelize({})).catch((err: Error) => err);
    keyFile.path = missing;
    keyFile.settingsPsk = undefined;
    const { message } = error as Error;
    expect(message).toContain('crypto.settingsPsk');
    expect(message).toContain('configSecret encrypt');
    expect(message).not.toContain('ab'.repeat(32));
  });

  it('fires for encrypted rows still held in local_system_facts', async () => {
    const sequelize = fakeSequelize({
      local_system_facts: [{ key: 'deviceKey', value: ENCRYPTED }],
    });
    await expect(checkConfigKey(sequelize)).rejects.toThrow(missing);
  });
});
