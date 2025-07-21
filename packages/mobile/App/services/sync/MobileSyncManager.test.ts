import { MobileSyncManager } from './MobileSyncManager';
import { CentralServerConnection } from './CentralServerConnection';
import {
  getModelsForDirection,
  getSyncTick,
  pushOutgoingChanges,
  snapshotOutgoingChanges,
} from './utils';
import { SettingsService } from '../settings';

const mockGetModelsForDirection = getModelsForDirection as jest.MockedFunction<typeof getModelsForDirection>;
const mockGetSyncTick = getSyncTick as jest.MockedFunction<typeof getSyncTick>;
const mockSnapshotOutgoingChanges = snapshotOutgoingChanges as jest.MockedFunction<typeof snapshotOutgoingChanges>;

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
  const centralServerConnection = new CentralServerConnection('test-device-id');
  const mockSettingsService = {
    getSetting: jest.fn().mockReturnValue({
      maxBatchesToKeepInMemory: 10,
      maxRecordsPerInsertBatch: 100,
      maxRecordsPerSnapshotBatch: 1000,
      useUnsafeSchemaForInitialSync: false,
    }),
  };
  let mobileSyncManager;

  beforeEach(() => {
    mobileSyncManager = new MobileSyncManager(
      centralServerConnection,
      mockSettingsService as unknown as SettingsService,
    );
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

    it("should call pullIncomingChanges() with the correct 'sessionId' and 'syncSettings'", async () => {
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
      expect(mobileSyncManager.pullIncomingChanges).toBeCalledWith(mockSessionId, {
        maxBatchesToKeepInMemory: 10,
        maxRecordsPerInsertBatch: 100,
        maxRecordsPerSnapshotBatch: 1000,
        useUnsafeSchemaForInitialSync: false,
      });
    });
  });

  describe('pushOutgoingChanges()', () => {
    it('should snapshotOutgoingChanges with the right models and correct lastSuccessfulSyncPush', async () => {
      const modelsToPush = { Patient: jest.fn(), PatientAdditionalData: jest.fn(), PatientDeathData: jest.fn() } as any;
      const pushSince = 2;
      const sessionId = 'test-session';
      const newSyncClockTime = 4;

      mockGetModelsForDirection.mockReturnValueOnce(modelsToPush);
      mockGetSyncTick.mockReturnValue(Promise.resolve(pushSince));
      mockSnapshotOutgoingChanges.mockReturnValueOnce(
        new Promise(resolve => {
          resolve([]);
        }),
      );

      await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime);

      expect(snapshotOutgoingChanges).toBeCalledWith(modelsToPush, pushSince);
    });

    it('should not push outgoing changes if there are no changes', async () => {
      const modelsToPush = { Patient: {}, PatientAdditionalData: {}, PatientDeathData: {} } as any;
      const sessionId = 'test-session';
      const newSyncClockTime = 4;

      mockGetModelsForDirection.mockReturnValueOnce(modelsToPush);
      mockSnapshotOutgoingChanges.mockImplementationOnce(() => Promise.resolve([]));

      await mobileSyncManager.pushOutgoingChanges(sessionId, newSyncClockTime);

      expect(pushOutgoingChanges).not.toBeCalled();
    });
  });
});
