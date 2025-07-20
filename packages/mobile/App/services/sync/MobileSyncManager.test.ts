import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';
import {
  getModelsForDirection,
  getSyncTick,
  pushOutgoingChanges,
  snapshotOutgoingChanges,
} from './utils';

jest.mock('./utils', () => ({
  setSyncTick: jest.fn(),
  snapshotOutgoingChanges: jest.fn(() => []),
  pushOutgoingChanges: jest.fn(),
  pullIncomingChanges: jest.fn(() => 0),
  saveIncomingChanges: jest.fn(),
  getModelsForDirection: jest.fn(),
  getSyncTick: jest.fn(),
  clearPersistedSyncSessionRecords: jest.fn(),
}));

jest.mock('./utils/manageSnapshotTable', () => ({
  dropSnapshotTable: jest.fn(),
}));

jest.mock('../../infra/db', () => ({
  Database: {
    models: {},
    client: {
      transaction: jest.fn(),
      query: jest.fn(),
    },
  },
}));

const mockSessionId = 'xxx';
const mockSyncTick = 5;

describe('MobileSyncManager', () => {
  const centralServerConnection = new CentralServerConnection();
  const mockSettingsService = {
    getSetting: jest.fn(),
  };
  let mobileSyncManager;

  beforeEach(() => {
    mobileSyncManager = new MobileSyncManager(centralServerConnection, mockSettingsService);
    jest.clearAllMocks();
  });

  describe('triggerSync()', () => {
    it('should call runSync() if it has not been started', async () => {
      jest.spyOn(mobileSyncManager, 'runSync');

      mobileSyncManager.triggerSync();

      expect(mobileSyncManager.runSync).toBeCalledTimes(1);
    });

    it('should only run one sync at a time', async () => {
      jest.spyOn(mobileSyncManager, 'runSync');

      const firstSyncPromise = mobileSyncManager.triggerSync();
      const secondSyncPromise = mobileSyncManager.triggerSync();

      await Promise.all([firstSyncPromise, secondSyncPromise]);

      expect(mobileSyncManager.runSync).toBeCalledTimes(1);
    });

    it('should throw an error when calling runSync() while sync is still running', async () => {
      mobileSyncManager.triggerSync();

      await expect(mobileSyncManager.runSync()).rejects.toThrow(
        'MobileSyncManager.runSync(): Tried to start syncing while sync in progress',
      );
    });
  });

  describe('runSync()', () => {
    it('should start sync session when running sync', async () => {
      const syncOutgoingChangesSpy = jest
        .spyOn(mobileSyncManager, 'syncOutgoingChanges')
        .mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullChanges').mockImplementationOnce(jest.fn());
      const startSyncSessionSpy = jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockImplementationOnce(
          jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      const startSyncSessionCallOrder = startSyncSessionSpy.mock.invocationCallOrder[0];
      const syncOutgoingChangesCallOrder = syncOutgoingChangesSpy.mock.invocationCallOrder[0];

      expect(startSyncSessionCallOrder).toBeLessThan(syncOutgoingChangesCallOrder);
    });

    it('should sync outgoing changes before incoming changes', async () => {
      const syncOutgoingChangesSpy = jest
        .spyOn(mobileSyncManager, 'syncOutgoingChanges')
        .mockImplementationOnce(jest.fn());
      const pullChangesSpy = jest
        .spyOn(mobileSyncManager, 'pullChanges')
        .mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockImplementationOnce(
          jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      const syncOutgoingChangesCallOrder = syncOutgoingChangesSpy.mock.invocationCallOrder[0];
      const pullChangesCallOrder = pullChangesSpy.mock.invocationCallOrder[0];

      expect(syncOutgoingChangesCallOrder).toBeLessThan(pullChangesCallOrder);
    });

    it("should call syncOutgoingChanges() with the correct 'sessionId' and 'newSyncClockTime'", async () => {
      jest.spyOn(mobileSyncManager, 'syncOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullChanges').mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockReturnValueOnce(
          new Promise(resolve => {
            resolve({ sessionId: mockSessionId, startedAtTick: mockSyncTick });
          }),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.syncOutgoingChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.syncOutgoingChanges).toBeCalledWith(mockSessionId, mockSyncTick);
    });

    it("should call pullChanges() with the correct 'sessionId' and 'syncSettings'", async () => {
      jest.spyOn(mobileSyncManager, 'syncOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullChanges').mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockReturnValueOnce(
          new Promise(resolve => {
            resolve({ sessionId: mockSessionId, startedAtTick: mockSyncTick });
          }),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.pullChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.pullChanges).toBeCalledWith(mockSessionId, expect.any(Object));
    });
  });

  describe('syncOutgoingChanges()', () => {
    it('should snapshotOutgoingChanges with the right models and correct lastSuccessfulSyncPush', async () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const pushSince = 2;
      const sessionId = 'test-session';
      const newSyncClockTime = 4;
      
      getModelsForDirection.mockReturnValueOnce(modelsToPush);
      getSyncTick.mockReturnValue(pushSince);
      snapshotOutgoingChanges.mockReturnValueOnce(new Promise(resolve => {
        resolve([]);
      }));

      await mobileSyncManager.syncOutgoingChanges(sessionId, newSyncClockTime);

      expect(snapshotOutgoingChanges).toBeCalledWith(modelsToPush, pushSince);
    });

    it('should not push outgoing changes if there are no changes', async () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const sessionId = 'test-session';
      const newSyncClockTime = 4;
      
      getModelsForDirection.mockReturnValueOnce(modelsToPush);
      snapshotOutgoingChanges.mockImplementationOnce(() => []);

      await mobileSyncManager.syncOutgoingChanges(sessionId, newSyncClockTime);

      expect(pushOutgoingChanges).not.toBeCalled();
    });
  });
});
