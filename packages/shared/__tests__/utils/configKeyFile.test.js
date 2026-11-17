import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const keyFile = vi.hoisted(() => ({ path: '' }));

vi.mock('config', () => ({
  default: {
    get: name => (name === 'crypto.keyFile' ? keyFile.path : undefined),
  },
}));

import { PUBLISHED_DEVELOPMENT_KEY, readConfigKeyFile } from '../../src/utils/crypto';

const DEVELOPMENT_KEY_FILE = 'config/dev-secret.key';

describe('readConfigKeyFile', () => {
  const originalDirectory = process.cwd();
  let directory;

  beforeAll(async () => {
    directory = await fs.mkdtemp(join(tmpdir(), 'tamanu-key-file-'));
    await fs.mkdir(join(directory, 'config'));
    process.chdir(directory);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(join(directory, DEVELOPMENT_KEY_FILE), { force: true });
  });

  afterAll(async () => {
    process.chdir(originalDirectory);
    await fs.rm(directory, { recursive: true, force: true });
  });

  it('generates a development key at the default path on first read, then reuses it', async () => {
    keyFile.path = DEVELOPMENT_KEY_FILE;

    const first = await readConfigKeyFile();
    const second = await readConfigKeyFile();

    expect(first).toHaveLength(32);
    expect(first.equals(PUBLISHED_DEVELOPMENT_KEY)).toBe(false);
    expect(second.equals(first)).toBe(true);
  });

  it('gives concurrent first reads the same generated key', async () => {
    keyFile.path = DEVELOPMENT_KEY_FILE;

    const keys = await Promise.all(Array.from({ length: 8 }, () => readConfigKeyFile()));

    expect(keys.every(key => key.equals(keys[0]))).toBe(true);
    expect(await fs.readdir(join(directory, 'config'))).toEqual(['dev-secret.key']);
  });

  it('generates nothing at a configured path other than the default', async () => {
    keyFile.path = join(directory, 'mounted.key');
    await expect(readConfigKeyFile()).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each([
    ['production', 'production'],
    ['an unset NODE_ENV', undefined],
  ])('generates nothing in %s, and says how to provide a key', async (_label, nodeEnv) => {
    vi.stubEnv('NODE_ENV', nodeEnv);
    keyFile.path = DEVELOPMENT_KEY_FILE;
    const error = await readConfigKeyFile().catch(err => err);
    expect(error).toMatchObject({ code: 'ENOENT' });
    expect(error.message).toContain('configSecret init');
    expect(error.message).toContain('CRYPTO_KEY_FILE');
  });

  it.each([
    ['production', 'production'],
    ['an unset NODE_ENV', undefined],
  ])(
    'refuses the published development key in %s, wherever it is mounted',
    async (_label, nodeEnv) => {
      const mountedPath = join(directory, 'mounted.key');
      await fs.writeFile(mountedPath, PUBLISHED_DEVELOPMENT_KEY);
      vi.stubEnv('NODE_ENV', nodeEnv);
      keyFile.path = mountedPath;

      const error = await readConfigKeyFile().catch(err => err);
      expect(error.message).toContain('development key published');
      expect(error.message).toContain('configSecret init');
    },
  );

  it('reads the published development key in a development environment', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    keyFile.path = join(directory, 'mounted.key');
    await fs.writeFile(keyFile.path, PUBLISHED_DEVELOPMENT_KEY);

    expect(await readConfigKeyFile()).toEqual(PUBLISHED_DEVELOPMENT_KEY);
  });

  it('reads any other key in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    keyFile.path = join(directory, 'own.key');
    await fs.writeFile(keyFile.path, new Uint8Array(32).fill(7));

    expect(await readConfigKeyFile()).toEqual(Buffer.from(new Uint8Array(32).fill(7)));
  });
});
