import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';
import {
  getSyncSessionIndex,
  getModelsForDirection,
  snapshotOutgoingChanges,
  pushOutgoingChanges,
} from './utils';

jest.mock('./utils', () => ({
  setSyncSessionSequence: jest.fn(),
  snapshotOutgoingChanges: jest.fn(),
  pushOutgoingChanges: jest.fn(),
  pullIncomingChanges: jest.fn(),
  saveIncomingChanges: jest.fn(),
  getModelsForDirection: jest.fn(),
  getSyncSessionIndex: jest.fn(),
}));

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
        .mockImplementationOnce(jest.fn());
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
      jest.spyOn(centralServerConnection, 'startSyncSession').mockImplementationOnce(jest.fn());
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      const syncOutgoingChangesCallOrder = syncOutgoingChangesSpy.mock.invocationCallOrder[0];
      const syncIncomingChangesCallOrder = syncIncomingChangesSpy.mock.invocationCallOrder[0];

      expect(syncOutgoingChangesCallOrder).toBeLessThan(syncIncomingChangesCallOrder);
    });

    it("should call syncOutgoingChanges() with the correct 'currentSessionIndex' and 'lastSuccessfulSessionIndex", async () => {
      jest.spyOn(mobileSyncManager, 'syncOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'syncIncomingChanges').mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockReturnValueOnce(new Promise(resolve => resolve(2)));
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      getSyncSessionIndex.mockReturnValueOnce(new Promise(resolve => resolve(1)));

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.syncOutgoingChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.syncOutgoingChanges).toBeCalledWith(2, 1);
    });

    it("should call syncIncomingChanges() with the correct 'currentSessionIndex' and 'lastSuccessfulSessionIndex", async () => {
      jest.spyOn(mobileSyncManager, 'syncOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'syncIncomingChanges').mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockReturnValueOnce(new Promise(resolve => resolve(2)));
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      getSyncSessionIndex.mockReturnValueOnce(new Promise(resolve => resolve(1)));

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.syncIncomingChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.syncIncomingChanges).toBeCalledWith(2, 1);
    });
  });

  describe('syncOutgoingChanges()', () => {
    it('should snapshotOutgoingChanges with the right models and correct lastSuccessfulSessionIndex', () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const lastSuccessfulSyncIndex = 2;
      const currentSessionIndex = 3;
      getModelsForDirection.mockReturnValueOnce(modelsToPush);
      snapshotOutgoingChanges.mockImplementationOnce(() => []);

      mobileSyncManager.syncOutgoingChanges(currentSessionIndex, lastSuccessfulSyncIndex);

      expect(snapshotOutgoingChanges).toBeCalledWith(modelsToPush, lastSuccessfulSyncIndex);
    });

    it('should not push outgoing changes if there are no changes', () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const lastSuccessfulSyncIndex = 2;
      const currentSessionIndex = 3;
      getModelsForDirection.mockReturnValueOnce(modelsToPush);
      snapshotOutgoingChanges.mockImplementationOnce(() => []);

      mobileSyncManager.syncOutgoingChanges(currentSessionIndex, lastSuccessfulSyncIndex);

      expect(pushOutgoingChanges).not.toBeCalled();
    });
  });
});
