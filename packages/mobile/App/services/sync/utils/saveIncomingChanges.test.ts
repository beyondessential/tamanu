import { saveChangesForModel } from './saveIncomingChanges';
import * as preparedQueryModules from './executePreparedQuery';
import { MobileSyncSettings } from '../MobileSyncManager';

jest.mock('./executePreparedQuery');
jest.mock('./buildFromSyncRecord', () => ({
  buildFromSyncRecord: jest.fn().mockImplementation((_model, records) =>
    records.map(record => ({ ...record.data, deletedAt: record.isDeleted ? 'now' : null })),
  ),
}));
// Mock dependencies like `model.find`

const repository = {
  find: jest.fn(),
};
const getModel = jest.fn(() => ({
  sanitizePulledRecordData: jest.fn().mockImplementation(d => d),
  getTransactionalRepository: jest.fn(() => repository),
}));
const Model = getModel() as any;
const progressCallback = jest.fn();

const mobileSyncSettings: MobileSyncSettings = {
  maxRecordsPerInsertBatch: 500,
  maxRecordsPerUpdateBatch: 500,
  maxBatchesToKeepInMemory: 10,
  maxRecordsPerSnapshotBatch: 500,
  useUnsafeSchemaForInitialSync: true,
  dynamicLimiter: {
    initialLimit: 10000,
    minLimit: 1000,
    maxLimit: 40000,
    maxLimitChangePerPage: 0.3,
    optimalTimePerPage: 500,
  },
};

const generateExistingRecord = (id, data = {}) => ({
  id,
  ...data,
});
const mockExistingRecords = records => {
  repository.find.mockImplementation(() => records);
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
