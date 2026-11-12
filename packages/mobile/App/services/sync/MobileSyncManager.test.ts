import NetInfo from '@react-native-community/netinfo';
import { RemoteUnreachableError } from '@tamanu/errors';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';
import { SYNC_EVENT_ACTIONS } from './types';
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
  getTableNamesForDirection: jest.fn(() => []),
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
    getSetting: jest.fn().mockReturnValue({
      maxBatchesToKeepInMemory: 10,
      maxRecordsPerInsertBatch: 100,
      maxRecordsPerSnapshotBatch: 1000,
      useUnsafeSchemaForInitialSync: false,
      dynamicLimiter: {
        initialLimit: 10000,
        minLimit: 1000,
        maxLimit: 40000,
        maxLimitChangePerPage: 0.3,
        optimalTimePerPage: 500,
      },
      maxUnreachableDuration: 600_000,
    }),
  };
  let mobileSyncManager;

  beforeEach(() => {
    mobileSyncManager = new MobileSyncManager(centralServerConnection, mockSettingsService as any);
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

    it('does not start a sync session when the device is offline', async () => {
      jest.mocked(NetInfo.refresh).mockResolvedValueOnce({ isConnected: false } as any);
      const startSyncSessionSpy = jest.spyOn(centralServerConnection, 'startSyncSession');
      const emitSpy = jest.spyOn(mobileSyncManager.emitter, 'emit');

      await mobileSyncManager.triggerSync();

      expect(startSyncSessionSpy).not.toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith(SYNC_EVENT_ACTIONS.SYNC_ERROR, {
        error: expect.any(RemoteUnreachableError),
      });
      expect(mobileSyncManager.isSyncing).toBe(false);
    });

    it('clears the queue state when a queued sync then fails to start', async () => {
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockResolvedValueOnce({ status: 'waitingInQueue' } as any);
      await mobileSyncManager.triggerSync();
      expect(mobileSyncManager.isQueuing).toBe(true);
      expect(mobileSyncManager.progressMessage).toBe('Sync in queue');

      jest.mocked(NetInfo.refresh).mockResolvedValueOnce({ isConnected: false } as any);
      await mobileSyncManager.triggerSync();

      expect(mobileSyncManager.isQueuing).toBe(false);
      expect(mobileSyncManager.progressMessage).toBe('');
    });

    it('resets progress when a sync fails', async () => {
      mobileSyncManager.setProgress(40, 'Pulling changes');
      jest.mocked(NetInfo.refresh).mockResolvedValueOnce({ isConnected: false } as any);

      await mobileSyncManager.triggerSync();

      expect(mobileSyncManager.progress).toBe(0);
      expect(mobileSyncManager.progressMessage).toBe('');
    });

    it('still tries to sync when the network state is unknown', async () => {
      jest.mocked(NetInfo.refresh).mockResolvedValueOnce({ isConnected: null } as any);
      const startSyncSessionSpy = jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockResolvedValueOnce({ status: 'waitingInQueue' } as any);

      await mobileSyncManager.triggerSync();

      expect(startSyncSessionSpy).toHaveBeenCalledTimes(1);
    });

    it('still tries to sync when the network state cannot be read', async () => {
      jest.mocked(NetInfo.refresh).mockRejectedValueOnce(new Error('native module unavailable'));
      const startSyncSessionSpy = jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockResolvedValueOnce({ status: 'waitingInQueue' } as any);

      await mobileSyncManager.triggerSync();

      expect(startSyncSessionSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('runSync()', () => {
    it('should start sync session when running sync', async () => {
      const pushOutgoingChangesSpy = jest
        .spyOn(mobileSyncManager, 'pushOutgoingChanges')
        .mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockImplementationOnce(jest.fn());
      const startSyncSessionSpy = jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockImplementationOnce(
          jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      const startSyncSessionCallOrder = startSyncSessionSpy.mock.invocationCallOrder[0];
      const pushOutgoingChangesCallOrder = pushOutgoingChangesSpy.mock.invocationCallOrder[0];

      expect(startSyncSessionCallOrder).toBeLessThan(pushOutgoingChangesCallOrder);
    });

    it('should sync outgoing changes before incoming changes', async () => {
      const pushOutgoingChangesSpy = jest
        .spyOn(mobileSyncManager, 'pushOutgoingChanges')
        .mockImplementationOnce(jest.fn());
      const pullIncomingChangesSpy = jest
        .spyOn(mobileSyncManager, 'pullIncomingChanges')
        .mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockImplementationOnce(
          jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      const pushOutgoingChangesCallOrder = pushOutgoingChangesSpy.mock.invocationCallOrder[0];
      const pullIncomingChangesCallOrder = pullIncomingChangesSpy.mock.invocationCallOrder[0];

      expect(pushOutgoingChangesCallOrder).toBeLessThan(pullIncomingChangesCallOrder);
    });

    it("should call pushOutgoingChanges() with the correct 'sessionId' and 'newSyncClockTime'", async () => {
      jest.spyOn(mobileSyncManager, 'pushOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(centralServerConnection, 'startSyncSession').mockReturnValueOnce(
        new Promise(resolve => {
          resolve({ sessionId: mockSessionId, startedAtTick: mockSyncTick });
        }),
      );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.pushOutgoingChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.pushOutgoingChanges).toBeCalledWith(mockSessionId, mockSyncTick);
    });

    it("should call pullIncomingChanges() with the correct 'sessionId'", async () => {
      jest.spyOn(mobileSyncManager, 'pushOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(centralServerConnection, 'startSyncSession').mockReturnValueOnce(
        new Promise(resolve => {
          resolve({ sessionId: mockSessionId, startedAtTick: mockSyncTick });
        }),
      );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.runSync();

      expect(mobileSyncManager.pullIncomingChanges).toBeCalledTimes(1);
      expect(mobileSyncManager.pullIncomingChanges).toBeCalledWith(mockSessionId);
    });

    it('should report the sync error to central when a step fails', async () => {
      const testError = new Error('pull failed');
      jest.spyOn(mobileSyncManager, 'pushOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockImplementationOnce(() => {
        throw testError;
      });
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockImplementationOnce(
          jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
        );
      const markSessionErroredSpy = jest
        .spyOn(centralServerConnection, 'markSessionErrored')
        .mockImplementationOnce(jest.fn());

      await expect(mobileSyncManager.runSync()).rejects.toThrow('pull failed');

      expect(markSessionErroredSpy).toHaveBeenCalledWith(mockSessionId, 'pull failed');
    });

    describe('keep awake', () => {
      it('should hold the screen awake from the session being granted until the sync ends', async () => {
        const pushOutgoingChangesSpy = jest
          .spyOn(mobileSyncManager, 'pushOutgoingChanges')
          .mockImplementationOnce(jest.fn());
        jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockImplementationOnce(jest.fn());
        const startSyncSessionSpy = jest
          .spyOn(centralServerConnection, 'startSyncSession')
          .mockImplementationOnce(
            jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
          );
        const endSyncSessionSpy = jest
          .spyOn(centralServerConnection, 'endSyncSession')
          .mockImplementationOnce(jest.fn());

        await mobileSyncManager.runSync();

        expect(activateKeepAwake).toBeCalledTimes(1);
        expect(deactivateKeepAwake).toBeCalledTimes(1);
        const [activateOrder] = (activateKeepAwake as jest.Mock).mock.invocationCallOrder;
        const [deactivateOrder] = (deactivateKeepAwake as jest.Mock).mock.invocationCallOrder;
        expect(startSyncSessionSpy.mock.invocationCallOrder[0]).toBeLessThan(activateOrder);
        expect(activateOrder).toBeLessThan(pushOutgoingChangesSpy.mock.invocationCallOrder[0]);
        expect(endSyncSessionSpy.mock.invocationCallOrder[0]).toBeLessThan(deactivateOrder);
      });

      it('should release the screen when the sync fails part way', async () => {
        jest.spyOn(mobileSyncManager, 'pushOutgoingChanges').mockImplementationOnce(jest.fn());
        jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockImplementationOnce(() => {
          throw new Error('pull failed');
        });
        jest
          .spyOn(centralServerConnection, 'startSyncSession')
          .mockImplementationOnce(
            jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
          );
        jest.spyOn(centralServerConnection, 'markSessionErrored').mockImplementationOnce(jest.fn());

        await expect(mobileSyncManager.runSync()).rejects.toThrow('pull failed');

        expect(activateKeepAwake).toBeCalledTimes(1);
        expect(deactivateKeepAwake).toBeCalledTimes(1);
      });

      it('should not hold the screen for a sync that is queued', async () => {
        jest
          .spyOn(centralServerConnection, 'startSyncSession')
          .mockImplementationOnce(jest.fn(async () => ({ status: 'queued' })));

        await mobileSyncManager.runSync();

        expect(activateKeepAwake).not.toBeCalled();
        expect(deactivateKeepAwake).not.toBeCalled();
      });
    });
  });

  describe('triggerSync() keep awake', () => {
    it('should hold and release the screen for a sync started through the trigger', async () => {
      jest.spyOn(mobileSyncManager, 'pushOutgoingChanges').mockImplementationOnce(jest.fn());
      jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockImplementationOnce(jest.fn());
      jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockImplementationOnce(
          jest.fn(async () => ({ sessionId: mockSessionId, startedAtTick: mockSyncTick })),
        );
      jest.spyOn(centralServerConnection, 'endSyncSession').mockImplementationOnce(jest.fn());

      await mobileSyncManager.triggerSync();

      expect(activateKeepAwake).toBeCalledTimes(1);
      expect(deactivateKeepAwake).toBeCalledTimes(1);
    });
  });

  describe('pushOutgoingChanges()', () => {
    it('should snapshotOutgoingChanges with the right models and correct lastSuccessfulSyncPush', async () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const pushSince = 2;
      const sessionId = 'test-session';
      const newSyncClockTime = 4;

      (getModelsForDirection as jest.Mock).mockReturnValueOnce(modelsToPush);
      (getSyncTick as jest.Mock).mockReturnValue(pushSince);
      (snapshotOutgoingChanges as jest.Mock).mockReturnValueOnce(
        new Promise(resolve => {
          resolve([]);
        }),
      );

      await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime);

      expect(snapshotOutgoingChanges).toBeCalledWith(modelsToPush, pushSince);
    });

    it('should not push outgoing changes if there are no changes', async () => {
      const modelsToPush = ['Patient', 'PatientAdditionalData', 'PatientDeathData'];
      const sessionId = 'test-session';
      const newSyncClockTime = 4;

      (getModelsForDirection as jest.Mock).mockReturnValueOnce(modelsToPush);
      (snapshotOutgoingChanges as jest.Mock).mockImplementationOnce(() => []);

      await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime);

      expect(pushOutgoingChanges).not.toBeCalled();
    });
  });
});
