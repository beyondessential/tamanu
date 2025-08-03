import { saveChangesForModel } from './saveIncomingChanges';
import * as saveChangeModules from './executeCrud';
import { MobileSyncSettings } from '../MobileSyncManager';

jest.mock('./executeCrud');
jest.mock('./buildFromSyncRecord', () => {
  return {
    buildFromSyncRecord: jest.fn().mockImplementation((_model, {data}) => {
      return data;
    }),
    buildForRawInsertFromSyncRecord: jest.fn().mockImplementation((_model, change) => {
      return { ...change.data, isDeleted: change.isDeleted };
    }),
    buildForRawInsertFromSyncRecords: jest.fn().mockImplementation((_model, records) => {
      return records.map(record => record.data);
    }),
  };
});
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
  maxBatchesToKeepInMemory: 10,
  maxRecordsPerSnapshotBatch: 500,
  useUnsafeSchemaForInitialSync: false,
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
      expect(saveChangeModules.executeInserts).toBeCalledTimes(1);
      expect(saveChangeModules.executeInserts).toBeCalledWith(
        repository,
        [
          { ...newRecord, isDeleted }, // isDeleted flag for soft deleting record after creation
        ],
        500,
        progressCallback,
      );
      expect(saveChangeModules.executeUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.executeDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.executeRestores).toBeCalledTimes(0);
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
      expect(saveChangeModules.executeInserts).toBeCalledTimes(1);
      expect(saveChangeModules.executeInserts).toBeCalledWith(
        repository,
        [
          {
            ...newRecord,
            isDeleted,
          }, // isDeleted flag for soft deleting record after creation
        ],
        500,
        progressCallback,
      );
      expect(saveChangeModules.executeUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.executeDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.executeRestores).toBeCalledTimes(0);
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
      expect(saveChangeModules.executeInserts).toBeCalledTimes(0);
      expect(saveChangeModules.executeUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.executeUpdates).toBeCalledWith(repository, [newRecord], progressCallback);
      expect(saveChangeModules.executeDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.executeRestores).toBeCalledTimes(0);
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
      expect(saveChangeModules.executeInserts).toBeCalledTimes(0);
      expect(saveChangeModules.executeUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.executeDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.executeRestores).toBeCalledTimes(0);
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
      expect(saveChangeModules.executeInserts).toBeCalledTimes(0);
      expect(saveChangeModules.executeUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.executeDeletes).toBeCalledTimes(1);
      expect(saveChangeModules.executeDeletes).toBeCalledWith(repository, [newRecord], progressCallback);
      expect(saveChangeModules.executeRestores).toBeCalledTimes(0);
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
      expect(saveChangeModules.executeInserts).toBeCalledTimes(0);
      expect(saveChangeModules.executeUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.executeDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.executeRestores).toBeCalledTimes(1);
      expect(saveChangeModules.executeRestores).toBeCalledWith(
        repository,
        [newRecord],
        progressCallback,
      );
    });
  });
});
