import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';
import {
  getModelsForDirection,
  getSyncTick,
  getTableNamesForDirection,
  pushOutgoingChanges,
  snapshotOutgoingChanges,
} from './utils';
import { CURRENT_SYNC_TIME } from './constants';

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
    }),
  };
  let mobileSyncManager;

  beforeEach(() => {
    mobileSyncManager = new MobileSyncManager(centralServerConnection, mockSettingsService as any);
    jest.clearAllMocks();
    // a push with nothing to send still reports its cursor to central, so every push path
    // reaches completePush — stub it so no test makes a real request
    jest.spyOn(centralServerConnection, 'completePush').mockResolvedValue(undefined);
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
      // third arg is central's recorded push cursor, undefined here as the mock returns none
      expect(mobileSyncManager.pushOutgoingChanges).toBeCalledWith(
        mockSessionId,
        mockSyncTick,
        undefined,
      );
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

    it('should not push outgoing changes if there are no changes, but still reports the cursor', async () => {
      const modelsToPush = ['Patient'];
      const sessionId = 'test-session';
      const newSyncClockTime = 4;
      const currentSyncTick = 100;

      (getModelsForDirection as jest.Mock).mockReturnValueOnce(modelsToPush);
      (getTableNamesForDirection as jest.Mock).mockReturnValueOnce(['patients']);
      (getSyncTick as jest.Mock).mockImplementation((_models, key) =>
        key === CURRENT_SYNC_TIME ? currentSyncTick : 10,
      );
      (snapshotOutgoingChanges as jest.Mock).mockImplementationOnce(() => []);
      const completePushSpy = centralServerConnection.completePush as jest.Mock;

      await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime);

      // the batched push helper is skipped, but central is still told how far we've pushed so its
      // cursor tracks ours on an idle sync
      expect(pushOutgoingChanges).not.toBeCalled();
      expect(completePushSpy).toBeCalledWith(sessionId, ['patients'], currentSyncTick);
    });

    // Central is the authority on how far we've pushed, so we resume from the lower of its cursor
    // and our own. Mirrors the facility cases in FacilitySyncManager.test.js (spec: PUSH).
    describe('resuming from the lower of the two cursors', () => {
      const sessionId = 'test-session';
      const newSyncClockTime = 200;
      const currentSyncTick = 100;
      const localPushCursor = 10;

      const arrange = () => {
        const modelsToPush = ['Patient'];
        (getModelsForDirection as jest.Mock).mockReturnValueOnce(modelsToPush);
        (getSyncTick as jest.Mock).mockImplementation((_models, key) =>
          key === CURRENT_SYNC_TIME ? currentSyncTick : localPushCursor,
        );
        (snapshotOutgoingChanges as jest.Mock).mockImplementationOnce(() => []);
      };

      it("resumes from central's cursor when it is below the local one", async () => {
        arrange();

        await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime, 5);

        expect(snapshotOutgoingChanges).toBeCalledWith(['Patient'], 5);
      });

      it("resumes from the local cursor when central's is above it", async () => {
        arrange();

        await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime, 50);

        expect(snapshotOutgoingChanges).toBeCalledWith(['Patient'], localPushCursor);
      });

      it('falls back to the local cursor when central holds none', async () => {
        arrange();

        await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime, null);

        expect(snapshotOutgoingChanges).toBeCalledWith(['Patient'], localPushCursor);
      });

      it('reports the local tick it has pushed up to when completing the push', async () => {
        const modelsToPush = ['Patient'];
        (getModelsForDirection as jest.Mock).mockReturnValueOnce(modelsToPush);
        (getSyncTick as jest.Mock).mockImplementation((_models, key) =>
          key === CURRENT_SYNC_TIME ? currentSyncTick : localPushCursor,
        );
        (snapshotOutgoingChanges as jest.Mock).mockImplementationOnce(() => [
          { recordType: 'patients', recordId: 'abc', data: {} },
        ]);

        await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime, 5);

        // the reported cursor is the tick current before this session bumped the clock, not the
        // new tick, so records stamped mid-push are still picked up next time
        expect((pushOutgoingChanges as jest.Mock).mock.calls[0][6]).toBe(currentSyncTick);
      });
    });
  });
});
