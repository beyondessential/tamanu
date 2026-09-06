import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const keyFile = vi.hoisted(() => ({ path: '' }));

vi.mock('config', () => ({
  default: {
    get: (name: string) => (name === 'crypto.keyFile' ? keyFile.path : undefined),
  },
}));

import { checkConfigKey } from '../src/checkConfigKey.js';
import { encryptSecret } from '@tamanu/shared/utils/crypto';

type Row = { key: string; value: string | null };

const fakeSequelize = (tables: Record<string, Row[]>) =>
  ({
    query: vi.fn(async (sql: string, options?: any) => {
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
    const sequelize = fakeSequelize({
      local_system_secrets: [{ key: 'deviceKey', value: readable }],
    });

    const error = await checkConfigKey(sequelize).catch((err: Error) => err);
    keyFile.path = missing;
    expect(error).toBeInstanceOf(Error);
    const { message } = error as Error;
    expect(message).toContain('does not decrypt');
    expect(message).toContain('restored from another deployment');
    expect(message).not.toContain('deviceKey');
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

  it('fires for encrypted rows still held in local_system_facts', async () => {
    const sequelize = fakeSequelize({
      local_system_facts: [{ key: 'deviceKey', value: ENCRYPTED }],
    });
    await expect(checkConfigKey(sequelize)).rejects.toThrow(missing);
  });
});
