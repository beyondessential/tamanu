import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';
import {
  getModelsForDirection,
  getSyncTick,
  hasOutgoingChanges,
  pushOutgoingChanges,
  setSyncTick,
  snapshotOutgoingChanges,
} from './utils';
import { LAST_SUCCESSFUL_PULL } from './constants';
import { SYNC_EVENT_ACTIONS } from './types';

jest.mock('./utils', () => ({
  setSyncTick: jest.fn(),
  snapshotOutgoingChanges: jest.fn(() => []),
  pushOutgoingChanges: jest.fn(),
  pullIncomingChanges: jest.fn(() => 0),
  saveIncomingChanges: jest.fn(),
  getModelsForDirection: jest.fn(),
  getTableNamesForDirection: jest.fn(() => []),
  getSyncTick: jest.fn(),
  hasOutgoingChanges: jest.fn(),
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

  describe('runSync() changes-pending check', () => {
    const scheduled = { urgent: false, scheduled: true };
    const lastPullTick = 120;
    let findFact: jest.Mock;
    let updateFact: jest.Mock;
    let checkSpy: jest.SpyInstance;
    let startSessionSpy: jest.SpyInstance;
    beforeEach(() => {
      findFact = jest.fn().mockResolvedValue(null);
      updateFact = jest.fn();
      mobileSyncManager.models = { LocalSystemFact: { findOne: findFact, update: updateFact } };
      (getSyncTick as jest.Mock).mockResolvedValue(lastPullTick);
      (hasOutgoingChanges as jest.Mock).mockResolvedValue(false);
      checkSpy = jest
        .spyOn(centralServerConnection, 'checkForChangesToPull')
        .mockResolvedValue(false);
      startSessionSpy = jest
        .spyOn(centralServerConnection, 'startSyncSession')
        .mockResolvedValue({ sessionId: mockSessionId, startedAtTick: mockSyncTick });
      jest.spyOn(mobileSyncManager, 'pushOutgoingChanges').mockResolvedValue(undefined);
      jest.spyOn(mobileSyncManager, 'pullIncomingChanges').mockResolvedValue(undefined);
      jest.spyOn(centralServerConnection, 'endSyncSession').mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('checks with the pull cursor, then ends the scheduled sync without a session when there is nothing to pull', async () => {
      expect(mobileSyncManager.lastSuccessfulSyncTime).toBeNull();
      const onSuccess = jest.fn();
      const onError = jest.fn();
      mobileSyncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_SUCCESS, onSuccess);
      mobileSyncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ERROR, onError);

      await mobileSyncManager.triggerSync(scheduled);

      expect(checkSpy).toBeCalledWith(lastPullTick);
      expect(startSessionSpy).not.toBeCalled();
      expect(activateKeepAwake).not.toBeCalled();
      // the displayed last synced time moves, but not the pull cursor
      expect(mobileSyncManager.lastSuccessfulSyncTime).toBeInstanceOf(Date);
      expect(updateFact).toBeCalledTimes(1);
      expect(updateFact).toBeCalledWith(
        { key: LAST_SUCCESSFUL_PULL },
        { updatedAt: mobileSyncManager.lastSuccessfulSyncTime },
      );
      // neither the update above nor a pull writes the cursor's value
      expect(setSyncTick).not.toBeCalled();
      expect(mobileSyncManager.pullIncomingChanges).not.toBeCalled();
      expect(onSuccess).toBeCalledTimes(1);
      expect(onError).not.toBeCalled();
      expect(mobileSyncManager.isSyncing).toBe(false);
    });

    it('opens a session when there are changes to pull', async () => {
      checkSpy.mockResolvedValueOnce(true);

      await mobileSyncManager.runSync(scheduled);

      expect(startSessionSpy).toBeCalledWith({ urgent: false, lastSyncedTick: lastPullTick });
      expect(mobileSyncManager.pullIncomingChanges).toBeCalledTimes(1);
    });

    it('leaves out the cursor when the device has never pulled', async () => {
      (getSyncTick as jest.Mock).mockResolvedValue(-1);

      await mobileSyncManager.runSync(scheduled);

      expect(checkSpy).toBeCalledWith(undefined);
    });

    it.each([
      [
        'there are outgoing changes',
        () => (hasOutgoingChanges as jest.Mock).mockResolvedValue(true),
      ],
      [
        'tables are waiting for a full resync',
        () => findFact.mockResolvedValue({ key: 'tablesForFullResync', value: 'patients' }),
      ],
    ])('opens a session without checking when %s', async (_, arrange) => {
      arrange();

      await mobileSyncManager.runSync(scheduled);

      expect(findFact).toBeCalledWith({ where: { key: 'tablesForFullResync' } });
      expect(checkSpy).not.toBeCalled();
      expect(startSessionSpy).toBeCalledTimes(1);
    });

    it.each([
      ['an ordinary', { urgent: false }],
      ['an urgent', { urgent: true }],
    ])('opens a session without checking for %s sync', async (_, options) => {
      await mobileSyncManager.runSync(options);

      expect(checkSpy).not.toBeCalled();
      expect(startSessionSpy).toBeCalledWith({ ...options, lastSyncedTick: lastPullTick });
    });

    it('fails the sync, without opening a session, when central cannot be reached for the check', async () => {
      checkSpy.mockRejectedValueOnce(new Error('Network Error'));
      const onSuccess = jest.fn();
      const onError = jest.fn();
      mobileSyncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_SUCCESS, onSuccess);
      mobileSyncManager.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ERROR, onError);

      await mobileSyncManager.triggerSync(scheduled);

      expect(onError).toBeCalledWith({
        error: expect.objectContaining({ message: 'Network Error' }),
      });
      expect(onSuccess).not.toBeCalled();
      expect(startSessionSpy).not.toBeCalled();
      expect(mobileSyncManager.lastSuccessfulSyncTime).toBeNull();
      expect(updateFact).not.toBeCalled();
      expect(mobileSyncManager.isSyncing).toBe(false);
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
