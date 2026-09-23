import { MobileSyncManager, type MobileSyncSettings } from './MobileSyncManager';
import { SYNC_EVENT_ACTIONS, type SyncEndedEvent } from './types';

jest.mock('./utils', () => ({
  getModelsForDirection: jest.fn(() => ({}) as any),
  getTransactingModelsForDirection: jest.fn(() => [] as any),
  getSyncTick: jest.fn(),
  setSyncTick: jest.fn(),
  pushOutgoingChanges: jest.fn().mockResolvedValue(undefined),
  snapshotOutgoingChanges: jest.fn().mockResolvedValue([]),
}));

jest.mock('./utils/saveIncomingChanges', () => ({
  saveChangesFromMemory: jest.fn().mockResolvedValue(new Set()),
  saveChangesFromSnapshot: jest.fn().mockResolvedValue(new Set()),
}));

jest.mock('./utils/manageSnapshotTable', () => ({
  dropSnapshotTable: jest.fn().mockResolvedValue(undefined),
  createSnapshotTable: jest.fn().mockResolvedValue(undefined),
  insertSnapshotRecords: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./utils/pullRecordsInBatches', () => ({
  pullRecordsInBatches: jest.fn(),
}));

jest.mock('./utils/checkForeignKeys', () => ({
  checkForeignKeys: jest.fn(async () => true),
}));

// Referenced lazily from the `transaction` mock below, so it's safe despite jest hoisting
const mockLocalSystemFactRepo = {
  delete: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  insert: jest.fn(),
};

jest.mock('../../infra/db', () => ({
  Database: {
    models: {} as any,
    setUnsafePragma: jest.fn().mockResolvedValue(undefined),
    setDefaultPragma: jest.fn().mockResolvedValue(undefined),
    client: {
      transaction: jest.fn(async (cb: any) => {
        const entityManager = {
          queryRunner: { isTransactionActive: true },
          getRepository: jest.fn(() => mockLocalSystemFactRepo),
          query: jest.fn().mockResolvedValue(undefined),
        } as any;
        return cb(entityManager);
      }),
    },
  },
}));

const { getSyncTick } = jest.requireMock('./utils');
const { saveChangesFromMemory, saveChangesFromSnapshot } = jest.requireMock(
  './utils/saveIncomingChanges',
);
const { createSnapshotTable, insertSnapshotRecords } = jest.requireMock(
  './utils/manageSnapshotTable',
);
const { pullRecordsInBatches } = jest.requireMock('./utils/pullRecordsInBatches');
const { Database } = jest.requireMock('../../infra/db');

const makeCentral = () => ({
  startSyncSession: jest.fn().mockResolvedValue({
    sessionId: 'session-1',
    startedAtTick: 5000,
    status: 'running',
  }),
  initiatePull: jest.fn().mockResolvedValue({ totalToPull: 2, pullUntil: 999 }),
  endSyncSession: jest.fn().mockResolvedValue(undefined),
});

const makeSettings = (overrides: Partial<MobileSyncSettings> = {}) => ({
  getSetting: jest.fn().mockImplementation((key: string) => {
    if (key !== 'mobileSync') return undefined;
    return {
      maxBatchesToKeepInMemory: 2,
      maxRecordsPerSnapshotBatch: 1000,
      maxRecordsPerInsertBatch: 500,
      maxRecordsPerUpdateBatch: 500,
      useUnsafeSchemaForInitialSync: true,
      dynamicLimiter: {
        initialLimit: 10000,
        minLimit: 1000,
        maxLimit: 40000,
        maxLimitChangePerPage: 0.3,
        optimalTimePerPage: 500,
      },
      ...overrides,
    } as MobileSyncSettings;
  }),
});

describe('MobileSyncManager pull: initial vs incremental', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure model lookups used by MobileSyncManager exist
    Database.models = {
      LocalSystemFact: {
        findOne: jest.fn().mockResolvedValue(undefined),
        getTableName: () => 'local_system_facts',
      },
    } as any;
  });

  it('initial sync saves from memory', async () => {
    // Arrange: pullSince = -1 triggers initial sync
    (getSyncTick as jest.Mock)
      .mockResolvedValueOnce(-1) // LAST_SUCCESSFUL_PULL
      .mockResolvedValueOnce(0) // CURRENT_SYNC_TIME
      .mockResolvedValueOnce(0); // LAST_SUCCESSFUL_PUSH

    // Pull records mock: invoke processor once
    (pullRecordsInBatches as jest.Mock).mockImplementation(async (_params, process) => {
      const records = [
        { id: '1', recordId: '1', recordType: 'patient', data: { id: '1' }, isDeleted: false },
      ];
      await process(records as any);
    });

    const central = makeCentral();
    const settings = makeSettings();
    const mgr = new MobileSyncManager(central as any, settings as any);

    // Act
    await mgr.runSync();

    // Assert
    expect(mgr.isInitialSync).toBe(true);
    expect(Database.setUnsafePragma).toHaveBeenCalled();
    expect(Database.setDefaultPragma).toHaveBeenCalled();
    expect(saveChangesFromMemory).toHaveBeenCalled();
    expect(saveChangesFromSnapshot).not.toHaveBeenCalled();
    expect(createSnapshotTable).not.toHaveBeenCalled();
    expect(insertSnapshotRecords).not.toHaveBeenCalled();
  });

  it('incremental sync saves from snapshot', async () => {
    // Arrange: pullSince != -1 triggers incremental sync
    (getSyncTick as jest.Mock)
      .mockResolvedValueOnce(100) // LAST_SUCCESSFUL_PULL
      .mockResolvedValueOnce(0) // CURRENT_SYNC_TIME
      .mockResolvedValueOnce(0); // LAST_SUCCESSFUL_PUSH

    (pullRecordsInBatches as jest.Mock).mockImplementation(async (_params, process) => {
      // first stage (stage 2): should pass process that inserts into snapshot
      await process([
        { id: '2', recordId: '2', recordType: 'patient', data: { id: '2' }, isDeleted: false },
      ] as any);
    });

    const central = makeCentral();
    const settings = makeSettings();
    const mgr = new MobileSyncManager(central as any, settings as any);

    // Act
    await mgr.runSync();

    // Assert
    expect(mgr.isInitialSync).toBe(false);
    expect(createSnapshotTable).toHaveBeenCalled();
    expect(insertSnapshotRecords).toHaveBeenCalled();
    expect(saveChangesFromSnapshot).toHaveBeenCalled();
    expect(saveChangesFromMemory).not.toHaveBeenCalled();
  });

  it('incremental sync with nothing to pull skips the snapshot and save, but still advances the pull cursor', async () => {
    (getSyncTick as jest.Mock)
      .mockResolvedValueOnce(100) // LAST_SUCCESSFUL_PULL
      .mockResolvedValueOnce(0) // CURRENT_SYNC_TIME
      .mockResolvedValueOnce(0); // LAST_SUCCESSFUL_PUSH

    const central = makeCentral();
    central.initiatePull.mockResolvedValue({ totalToPull: 0, pullUntil: 999 });
    const settings = makeSettings();
    const mgr = new MobileSyncManager(central as any, settings as any);

    await mgr.runSync();

    expect(createSnapshotTable).not.toHaveBeenCalled();
    expect(pullRecordsInBatches).not.toHaveBeenCalled();
    expect(saveChangesFromSnapshot).not.toHaveBeenCalled();
    expect(saveChangesFromMemory).not.toHaveBeenCalled();

    expect(Database.client.transaction).toHaveBeenCalledTimes(1);
    expect(mockLocalSystemFactRepo.delete).toHaveBeenCalledWith({ key: 'tablesForFullResync' });
    expect(mockLocalSystemFactRepo.insert).toHaveBeenCalledWith({
      key: 'lastSuccessfulSyncPull',
      value: '999',
    });
  });

  describe('touched tables', () => {
    /** Drives a full sync and returns the SYNC_ENDED payload */
    const runAndCapture = async (mgr: MobileSyncManager): Promise<SyncEndedEvent> => {
      const onEnded = jest.fn();
      mgr.emitter.on(SYNC_EVENT_ACTIONS.SYNC_ENDED, onEnded);
      await mgr.triggerSync();
      expect(onEnded).toHaveBeenCalledTimes(1);
      return onEnded.mock.calls[0][0];
    };

    const mockIncrementalTicks = () => {
      (getSyncTick as jest.Mock)
        .mockResolvedValueOnce(100) // LAST_SUCCESSFUL_PULL
        .mockResolvedValueOnce(0) // CURRENT_SYNC_TIME
        .mockResolvedValueOnce(0); // LAST_SUCCESSFUL_PUSH
    };

    it('initial sync reports the tables saved from memory plus the sync cursor table', async () => {
      (getSyncTick as jest.Mock)
        .mockResolvedValueOnce(-1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      (pullRecordsInBatches as jest.Mock).mockImplementation(async (_params, process) => {
        await process([]);
        await process([]);
      });
      (saveChangesFromMemory as jest.Mock)
        .mockResolvedValueOnce(new Set(['patients']))
        .mockResolvedValueOnce(new Set(['encounters']));
      const mgr = new MobileSyncManager(makeCentral() as any, makeSettings() as any);

      const { touchedTables } = await runAndCapture(mgr);

      expect([...touchedTables].sort()).toEqual(['encounters', 'local_system_facts', 'patients']);
    });

    it('incremental sync reports the tables saved from the snapshot plus the sync cursor table', async () => {
      mockIncrementalTicks();
      (pullRecordsInBatches as jest.Mock).mockImplementation(async (_params, process) => {
        await process([]);
      });
      (saveChangesFromSnapshot as jest.Mock).mockResolvedValueOnce(new Set(['patients']));
      const mgr = new MobileSyncManager(makeCentral() as any, makeSettings() as any);

      const { touchedTables } = await runAndCapture(mgr);

      expect([...touchedTables].sort()).toEqual(['local_system_facts', 'patients']);
    });

    it('a sync with nothing to pull reports only the sync cursor table', async () => {
      mockIncrementalTicks();
      const central = makeCentral();
      central.initiatePull.mockResolvedValue({ totalToPull: 0, pullUntil: 999 });
      const mgr = new MobileSyncManager(central as any, makeSettings() as any);

      const { touchedTables } = await runAndCapture(mgr);

      expect([...touchedTables]).toEqual(['local_system_facts']);
    });

    it('a failed pull reports only what the push committed', async () => {
      mockIncrementalTicks();
      (pullRecordsInBatches as jest.Mock).mockRejectedValue(new Error('network down'));
      const mgr = new MobileSyncManager(makeCentral() as any, makeSettings() as any);

      const { touchedTables } = await runAndCapture(mgr);

      expect([...touchedTables]).toEqual(['local_system_facts']);
      expect(saveChangesFromSnapshot).not.toHaveBeenCalled();
    });

    it('does not carry tables over from the previous run', async () => {
      mockIncrementalTicks();
      (pullRecordsInBatches as jest.Mock).mockImplementation(async (_params, process) => {
        await process([]);
      });
      (saveChangesFromSnapshot as jest.Mock).mockResolvedValueOnce(new Set(['patients']));
      const central = makeCentral();
      const mgr = new MobileSyncManager(central as any, makeSettings() as any);
      const first = await runAndCapture(mgr);
      expect(first.touchedTables.has('patients')).toBe(true);

      mockIncrementalTicks();
      central.initiatePull.mockResolvedValue({ totalToPull: 0, pullUntil: 1000 });
      const second = await runAndCapture(mgr);

      expect([...second.touchedTables]).toEqual(['local_system_facts']);
      // The first payload was a snapshot, unaffected by the second run
      expect(first.touchedTables.has('patients')).toBe(true);
    });
  });
});
