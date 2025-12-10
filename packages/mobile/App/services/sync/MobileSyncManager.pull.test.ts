import { MobileSyncManager, type MobileSyncSettings } from './MobileSyncManager';

jest.mock('./utils', () => ({
  getModelsForDirection: jest.fn(() => ({} as any)),
  getTransactingModelsForDirection: jest.fn(() => ([] as any)),
  getSyncTick: jest.fn(),
  setSyncTick: jest.fn(),
  pushOutgoingChanges: jest.fn().mockResolvedValue(undefined),
  snapshotOutgoingChanges: jest.fn().mockResolvedValue([]),
}));

jest.mock('./utils/saveIncomingChanges', () => ({
  saveChangesFromMemory: jest.fn().mockResolvedValue(undefined),
  saveChangesFromSnapshot: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./utils/manageSnapshotTable', () => ({
  dropSnapshotTable: jest.fn().mockResolvedValue(undefined),
  createSnapshotTable: jest.fn().mockResolvedValue(undefined),
  insertSnapshotRecords: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./utils/pullRecordsInBatches', () => ({
  pullRecordsInBatches: jest.fn(),
}));

jest.mock('./utils/sortInDependencyOrder', () => ({
  sortInDependencyOrder: jest.fn(async (models: any) => models),
}));

jest.mock('../../infra/db', () => ({
  Database: {
    models: {} as any,
    setUnsafePragma: jest.fn().mockResolvedValue(undefined),
    setDefaultPragma: jest.fn().mockResolvedValue(undefined),
    client: {
      transaction: jest.fn(async (cb: any) => {
        const repo = {
          delete: jest.fn(),
          findOne: jest.fn(),
          save: jest.fn(),
          insert: jest.fn(),
        };
        const entityManager = {
          queryRunner: { isTransactionActive: true },
          getRepository: jest.fn(() => repo),
        } as any;
        await cb(entityManager);
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
      },
    } as any;
  });

  it('initial sync saves from memory', async () => {
    // Arrange: pullSince = -1 triggers initial sync
    (getSyncTick as jest.Mock).mockResolvedValueOnce(-1) // LAST_SUCCESSFUL_PULL
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
    (getSyncTick as jest.Mock).mockResolvedValueOnce(100) // LAST_SUCCESSFUL_PULL
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
});


