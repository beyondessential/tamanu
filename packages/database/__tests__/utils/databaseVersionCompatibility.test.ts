import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FACT_CURRENT_VERSION } from '@tamanu/constants';
import {
  buildDatabaseVersionIncompatibleError,
  syncDatabaseServerVersion,
} from '../../src/utils/databaseVersionCompatibility';

describe('syncDatabaseServerVersion', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let storedValue: string | null;
  let models: {
    LocalSystemFact: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    storedValue = null;
    models = {
      LocalSystemFact: {
        get: vi.fn(async () => storedValue),
        set: vi.fn(async (_key: string, value: string) => {
          storedValue = value;
        }),
      },
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('writes the server version when the fact is missing', async () => {
    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0' });

    expect(models.LocalSystemFact.set).toHaveBeenCalledWith(FACT_CURRENT_VERSION, '2.44.0');
  });

  it('writes the server version when the fact is unknown', async () => {
    storedValue = 'unknown';

    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0' });

    expect(models.LocalSystemFact.set).toHaveBeenCalledWith(FACT_CURRENT_VERSION, '2.44.0');
  });

  it('writes the server version when the fact is invalid semver', async () => {
    storedValue = 'not-a-version';

    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0' });

    expect(models.LocalSystemFact.set).toHaveBeenCalledWith(FACT_CURRENT_VERSION, '2.44.0');
  });

  it('throws when the stored version is newer than the server', async () => {
    storedValue = '2.45.0';

    await expect(
      syncDatabaseServerVersion({ models, serverVersion: '2.44.0' }),
    ).rejects.toThrow(/Database version compatibility check failed/);
    expect(models.LocalSystemFact.set).not.toHaveBeenCalled();
  });

  it('updates the fact when the stored version is older than the server', async () => {
    storedValue = '2.43.0';

    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0' });

    expect(models.LocalSystemFact.set).toHaveBeenCalledWith(FACT_CURRENT_VERSION, '2.44.0');
  });

  it('does not write when the stored version matches the server', async () => {
    storedValue = '2.44.0';

    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0' });

    expect(models.LocalSystemFact.set).not.toHaveBeenCalled();
  });

  it('skips the check and write outside production', async () => {
    process.env.NODE_ENV = 'development';
    storedValue = '9.9.9';

    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0' });

    expect(models.LocalSystemFact.get).not.toHaveBeenCalled();
    expect(models.LocalSystemFact.set).not.toHaveBeenCalled();
  });

  it('skips the check and write when skipVersionCompatibilityCheck is true', async () => {
    storedValue = '9.9.9';

    await syncDatabaseServerVersion({
      models,
      serverVersion: '2.44.0',
      skipVersionCompatibilityCheck: true,
    });

    expect(models.LocalSystemFact.get).not.toHaveBeenCalled();
    expect(models.LocalSystemFact.set).not.toHaveBeenCalled();
  });

  it('does not write in checkOnly mode when the fact is missing', async () => {
    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0', checkOnly: true });

    expect(models.LocalSystemFact.set).not.toHaveBeenCalled();
  });

  it('does not write in checkOnly mode when the stored version is older', async () => {
    storedValue = '2.43.0';

    await syncDatabaseServerVersion({ models, serverVersion: '2.44.0', checkOnly: true });

    expect(models.LocalSystemFact.set).not.toHaveBeenCalled();
  });

  it('still throws in checkOnly mode when the stored version is newer', async () => {
    storedValue = '2.45.0';

    await expect(
      syncDatabaseServerVersion({ models, serverVersion: '2.44.0', checkOnly: true }),
    ).rejects.toThrow(/Database version compatibility check failed/);
  });

  it('uses global.serverInfo.version when serverVersion is omitted', async () => {
    global.serverInfo = { version: '2.44.0', serverType: 'central' };

    await syncDatabaseServerVersion({ models });

    expect(models.LocalSystemFact.set).toHaveBeenCalledWith(FACT_CURRENT_VERSION, '2.44.0');
  });
});

describe('buildDatabaseVersionIncompatibleError', () => {
  it('includes both versions and recovery guidance', () => {
    const error = buildDatabaseVersionIncompatibleError('2.45.0', '2.44.0');

    expect(error.message).toContain('2.45.0');
    expect(error.message).toContain('2.44.0');
    expect(error.message).toContain('local_system_facts');
    expect(error.message).toContain('--skipVersionCompatibilityCheck');
  });
});
