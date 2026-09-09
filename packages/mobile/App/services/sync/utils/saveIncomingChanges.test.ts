import { saveChangesForModel } from './saveIncomingChanges';
import * as preparedQueryModules from './executePreparedQuery';
import type { MobileSyncSettings } from '../MobileSyncManager';

jest.mock('./executePreparedQuery');
jest.mock('./buildFromSyncRecord', () => ({
  buildFromSyncRecord: jest
    .fn()
    .mockImplementation((_model, records) =>
      records.map(record => ({ ...record.data, deletedAt: record.isDeleted ? 'now' : null })),
    ),
}));
// Mock dependencies like `repository.query`

const repository = {
  query: jest.fn(),
  metadata: { tableName: 'test_table' },
};
const getModel = jest.fn(() => ({
  sanitizePulledRecordData: jest.fn().mockImplementation(d => d),
  getTransactionalRepository: jest.fn(() => repository),
}));
const Model = getModel() as any;
const progressCallback = jest.fn();

const mobileSyncSettings = {
  maxRecordsPerInsertBatch: 500,
  maxRecordsPerUpdateBatch: 500,
  maxBatchesToKeepInMemory: 10,
  maxRecordsPerSnapshotBatch: 500,
  useUnsafeSchemaForInitialSync: true,
  dynamicLimiter: {
    initialLimit: 10_000,
    minLimit: 1_000,
    maxLimit: 40_000,
    maxLimitChangePerPage: 0.3,
    optimalTimePerPage: 500,
  },
} as const satisfies MobileSyncSettings;

const generateExistingRecord = (id, data = {}) => ({
  id,
  ...data,
});
const mockExistingRecords = records => {
  repository.query.mockImplementation(() => records.map(({ id }) => ({ id })));
};

describe('saveChangesForModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('executeInserts', () => {
    it('should create new records correctly', async () => {
      // setup test data
      const existingRecords = [];
      mockExistingRecords(existingRecords);
      const newRecord = { id: 'new_record_id' };
      const isDeleted = false;
      const changes = [
        {
          id: 'new_record_id',
          recordId: 'new_record_id',
          recordType: 'string',
          data: newRecord,
          isDeleted,
        },
      ];
      // act
      await saveChangesForModel(Model, changes, mobileSyncSettings, progressCallback);
      // assertions
      expect(preparedQueryModules.executePreparedInsert).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedInsert).toBeCalledWith(
        repository,
        [expect.objectContaining({ ...newRecord, deletedAt: null })],
        500,
        progressCallback,
      );
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledWith(
        repository,
        [],
        500,
        progressCallback,
      );
    });

    it('should create new records even if they are soft undeleted', async () => {
      // setup test data
      const existingRecords = [];
      mockExistingRecords(existingRecords);
      const newRecord = {
        id: 'new_record_id',
      };
      const isDeleted = true;
      const changes = [
        {
          id: 'new_record_id',
          recordId: 'new_record_id',
          recordType: 'string',
          data: newRecord,
          isDeleted,
        },
      ];
      // act
      await saveChangesForModel(Model, changes, mobileSyncSettings, progressCallback);
      // assertions
      expect(preparedQueryModules.executePreparedInsert).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedInsert).toBeCalledWith(
        repository,
        [expect.objectContaining({ ...newRecord, deletedAt: 'now' })],
        500,
        progressCallback,
      );
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledWith(
        repository,
        [],
        500,
        progressCallback,
      );
    });
  });

  describe('existence check', () => {
    it('queries existing ids with a raw parameterised select', async () => {
      // setup test data
      const existingRecords = [generateExistingRecord('existing_record_id')];
      mockExistingRecords(existingRecords);
      const changes = [
        {
          id: 'existing_record_id',
          recordId: 'existing_record_id',
          recordType: 'string',
          data: { id: 'existing_record_id' },
          isDeleted: false,
        },
        {
          id: 'new_record_id',
          recordId: 'new_record_id',
          recordType: 'string',
          data: { id: 'new_record_id' },
          isDeleted: false,
        },
      ];
      // act
      await saveChangesForModel(Model, changes, mobileSyncSettings, progressCallback);
      // assertions
      expect(repository.query).toBeCalledTimes(1);
      expect(repository.query).toBeCalledWith('SELECT id FROM test_table WHERE id IN (?,?)', [
        'existing_record_id',
        'new_record_id',
      ]);
    });
  });

  describe('saveUpdates', () => {
    it('should update existing records correctly', async () => {
      // setup test data
      const existingRecords = [
        generateExistingRecord('existing_record_id', { status: 'historical' }),
      ];
      mockExistingRecords(existingRecords);
      const newRecord = {
        id: 'existing_record_id',
        status: 'current',
      };
      const isDeleted = false;
      const changes = [
        {
          id: 'existing_record_id',
          recordId: 'existing_record_id',
          recordType: 'string',
          data: newRecord,
          isDeleted,
        },
      ];
      // act
      await saveChangesForModel(Model, changes, mobileSyncSettings, progressCallback);
      // assertions
      expect(preparedQueryModules.executePreparedInsert).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedInsert).toBeCalledWith(
        repository,
        [],
        500,
        progressCallback,
      );
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledWith(
        repository,
        [expect.objectContaining({ ...newRecord, deletedAt: null })],
        500,
        progressCallback,
      );
    });

    it('should not update soft deleted records', async () => {
      // setup test data
      const existingRecords = [
        generateExistingRecord('existing_record_id', {
          status: 'historical',
          deletedAt: new Date(),
        }),
      ];
      mockExistingRecords(existingRecords);
      const newRecord = {
        id: 'existing_record_id',
        status: 'current',
      };
      const isDeleted = true;
      const changes = [
        {
          id: 'existing_record_id',
          recordId: 'existing_record_id',
          recordType: 'string',
          data: newRecord,
          isDeleted,
        },
      ];
      // act
      await saveChangesForModel(Model, changes, mobileSyncSettings, progressCallback);
      // assertions
      expect(preparedQueryModules.executePreparedInsert).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedInsert).toBeCalledWith(
        repository,
        [],
        500,
        progressCallback,
      );
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledTimes(1);
    });
  });

  describe('saveDeletes', () => {
    it('should delete records correctly', async () => {
      // setup test data
      const existingRecords = [generateExistingRecord('existing_record_id')];
      mockExistingRecords(existingRecords);
      const newRecord = {
        id: 'existing_record_id',
      };
      const isDeleted = true;
      const changes = [
        {
          id: 'existing_record_id',
          recordId: 'existing_record_id',
          recordType: 'string',
          data: newRecord,
          isDeleted,
        },
      ];
      // act
      await saveChangesForModel(Model, changes, mobileSyncSettings, progressCallback);
      // assertions
      expect(preparedQueryModules.executePreparedInsert).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedInsert).toBeCalledWith(
        repository,
        [],
        500,
        progressCallback,
      );
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledWith(
        repository,
        [expect.objectContaining({ ...newRecord, deletedAt: 'now' })],
        500,
        progressCallback,
      );
    });
  });

  describe('saveRestore', () => {
    it('should restore records correctly', async () => {
      // setup test data
      const existingRecords = [
        generateExistingRecord('existing_record_id', { deletedAt: new Date() }),
      ];
      mockExistingRecords(existingRecords);
      const newRecord = {
        id: 'existing_record_id',
      };
      const isDeleted = false;
      const changes = [
        {
          id: 'existing_record_id',
          recordId: 'existing_record_id',
          recordType: 'string',
          data: newRecord,
          isDeleted,
        },
      ];
      // act
      await saveChangesForModel(Model, changes, mobileSyncSettings, progressCallback);
      // assertions
      expect(preparedQueryModules.executePreparedInsert).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedInsert).toBeCalledWith(
        repository,
        [],
        500,
        progressCallback,
      );
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledTimes(1);
      expect(preparedQueryModules.executePreparedUpdate).toBeCalledWith(
        repository,
        [expect.objectContaining({ ...newRecord, deletedAt: null })],
        500,
        progressCallback,
      );
    });
  });
});
