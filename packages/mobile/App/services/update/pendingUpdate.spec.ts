import { version as currentVersion } from '/root/package.json';
import { readConfig, writeConfig } from '~/services/config';
import {
  clearUpdateState,
  hasInstalledUpdateAndStillOutOfDate,
  readPendingUpdate,
  recordInstallAttempt,
  recordPendingUpdate,
} from './pendingUpdate';

jest.mock('~/services/config', () => {
  const store: Record<string, string> = {};
  return {
    readConfig: jest.fn(async (key: string, defaultValue: string = null) =>
      store[key] !== undefined && store[key] !== '' ? store[key] : defaultValue,
    ),
    writeConfig: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    __store: store,
  };
});

const UPDATE_URL = 'https://meta.tamanu.app/versions/~2.68.0/mobile/package';

describe('pendingUpdate', () => {
  beforeEach(async () => {
    await clearUpdateState();
    (readConfig as jest.Mock).mockClear();
    (writeConfig as jest.Mock).mockClear();
  });

  it('has no outstanding update to begin with', async () => {
    expect(await readPendingUpdate()).toBeNull();
  });

  it('remembers an outstanding update for the version now running', async () => {
    await recordPendingUpdate(UPDATE_URL);
    expect(await readPendingUpdate()).toBe(UPDATE_URL);
  });

  it('drops an update recorded by a version that is no longer running', async () => {
    await recordPendingUpdate(UPDATE_URL);
    await writeConfig('pendingUpdateRecordedAtVersion', '0.0.1-an-older-build');

    expect(await readPendingUpdate()).toBeNull();
    // Dropped for good, so the server decides afresh rather than this resurfacing next launch.
    expect(await readPendingUpdate()).toBeNull();
  });

  it('forgets everything once the server has accepted the running version', async () => {
    await recordPendingUpdate(UPDATE_URL);
    await recordInstallAttempt();

    await clearUpdateState();

    expect(await readPendingUpdate()).toBeNull();
    expect(await hasInstalledUpdateAndStillOutOfDate()).toBe(false);
  });

  describe('hasInstalledUpdateAndStillOutOfDate', () => {
    it('is false when no install has been attempted', async () => {
      expect(await hasInstalledUpdateAndStillOutOfDate()).toBe(false);
    });

    it('is false when the install did not take, so the same version is still running', async () => {
      await recordInstallAttempt();
      expect(await hasInstalledUpdateAndStillOutOfDate()).toBe(false);
    });

    it('is true when an update installed and the app is rejected again', async () => {
      await recordInstallAttempt();
      await writeConfig('updateInstallAttemptedFromVersion', '0.0.1-the-version-before');

      expect(await hasInstalledUpdateAndStillOutOfDate()).toBe(true);
    });

    it('compares against the version actually running', async () => {
      await writeConfig('updateInstallAttemptedFromVersion', currentVersion);
      expect(await hasInstalledUpdateAndStillOutOfDate()).toBe(false);
    });
  });
});
