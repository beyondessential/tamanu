import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';
import {
  getSyncTick,
  getModelsForDirection,
  snapshotOutgoingChanges,
  pushOutgoingChanges,
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

jest.mock('../../infra/db', () => ({
  Database: {
    models: {},
    client: {
      transaction: jest.fn(),
    },
  },
}));

const mockSessionId = 'xxx';
const mockSyncTick = 5;

describe('MobileSyncManager', () => {
  const centralServerConnection = new CentralServerConnection();
  let mobileSyncManager;

  beforeEach(() => {
    mobileSyncManager = new MobileSyncManager(centralServerConnection);
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
      jest.spyOn(mobileSyncManager, 'syncIncomingChanges').mockImplementationOnce(jest.fn());
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
      const syncIncomingChangesSpy = jest
        .spyOn(mobileSyncManager, 'syncIncomingChanges')
        .mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockImplementationOnce(
          jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      const syncOutgoingChangesCallOrder = syncOutgoingChangesSpy.mock.invocationCallOrder[0];
      const syncIncomingChangesCallOrder = syncIncomingChangesSpy.mock.invocationCallOrder[0];

      expect(syncOutgoingChangesCallOrder).toBeLessThan(syncIncomingChangesCallOrder);
    });

    it("should call syncOutgoingChanges() with the correct 'sessionId' and 'currentSyncTick'", async () => {
      jest.spyOn(mobileSyncManager, 'syncOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'syncIncomingChanges').mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockReturnValueOnce(
          new Promise(resolve =>
            resolve({ sessionId: mockSessionId, startedAtTick: mockSyncTick }),
          ),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      getSyncTick.mockReturnValueOnce(new Promise(resolve => resolve(1)));

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.syncOutgoingChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.syncOutgoingChanges).toBeCalledWith(mockSessionId, mockSyncTick);
    });

    it("should call syncIncomingChanges() with the correct 'sessionId'", async () => {
      jest.spyOn(mobileSyncManager, 'syncOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'syncIncomingChanges').mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockReturnValueOnce(
          new Promise(resolve =>
            resolve({ sessionId: mockSessionId, startedAtTick: mockSyncTick }),
          ),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.syncIncomingChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.syncIncomingChanges).toBeCalledWith(mockSessionId);
    });
  });

  describe('syncOutgoingChanges()', () => {
    it('should snapshotOutgoingChanges with the right models and correct lastSuccessfulSyncPush', async () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const since = 2;
      const currentSyncTick = 3;
      getModelsForDirection.mockReturnValueOnce(modelsToPush);
      getSyncTick.mockReturnValueOnce(since);
      snapshotOutgoingChanges.mockReturnValueOnce(new Promise(resolve => resolve([])));

      await mobileSyncManager.syncOutgoingChanges(currentSyncTick, since);

      expect(snapshotOutgoingChanges).toBeCalledWith(modelsToPush, since);
    });

    it('should not push outgoing changes if there are no changes', () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const since = 2;
      const currentSyncTick = 3;
      getModelsForDirection.mockReturnValueOnce(modelsToPush);
      snapshotOutgoingChanges.mockImplementationOnce(() => []);

      mobileSyncManager.syncOutgoingChanges(currentSyncTick, since);

      expect(pushOutgoingChanges).not.toBeCalled();
    });
  });
});
