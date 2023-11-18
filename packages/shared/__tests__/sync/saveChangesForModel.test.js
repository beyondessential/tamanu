import { saveChangesForModel } from '../../src/sync';
import * as saveChangeModules from '../../src/sync/saveChanges';

jest.mock('../../src/sync/saveChanges');

// Mock dependencies like `model.findByIds`
const findByIds = jest.fn();
const get = jest.fn();
const getModel = jest.fn(() => ({
  findByIds,
  sanitizeForCentralServer: jest.fn().mockImplementation(d => d),
  get,
}));
const Model = getModel();

const generateExistingRecord = (id, data = {}) => ({
  id,
  data: { id, ...data },
  get: () => ({ id, ...data }),
});
const mockExistingRecords = records => {
  findByIds.mockImplementation(() => records);
  get.mockImplementation(() => records);
};

describe('saveChangesForModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('saveCreates', () => {
    it('should create new records correctly', async () => {
      // setup test data
      const existingRecords = [];
      mockExistingRecords(existingRecords);
      const newRecord = { id: 'new_record_id', deletedAt: null };
      const changes = [{ data: newRecord, isDeleted: !!newRecord.deletedAt }];
      // act
      await saveChangesForModel(Model, changes, true);
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(1);
      expect(saveChangeModules.saveCreates).toBeCalledWith(Model, [newRecord]);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
    });

    it('should create new records even if they are soft undeleted', async () => {
      // setup test data
      const existingRecords = [];
      mockExistingRecords(existingRecords);
      const newRecord = { id: 'new_record_id', deletedAt: new Date() };
      const changes = [{ data: newRecord, isDeleted: !!newRecord.deletedAt }];
      // act
      await saveChangesForModel(Model, changes, true);
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(1);
      expect(saveChangeModules.saveCreates).toBeCalledWith(Model, [newRecord]);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
    });
  });

  describe('saveUpdates', () => {
    it('should update existing records correctly', async () => {
      // setup test data
      const existingRecords = [
        generateExistingRecord('existing_record_id', { status: 'historical' }),
      ];
      mockExistingRecords(existingRecords);
      const newRecord = { id: 'existing_record_id', deletedAt: null, status: 'current' };
      const changes = [{ data: newRecord, isDeleted: !!newRecord.deletedAt }];
      // act
      await saveChangesForModel(Model, changes, true);
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.saveUpdates).toBeCalledWith(
        Model,
        [newRecord],
        expect.anything(),
        true,
      );
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
    });

    it('should not update soft deleted records', async () => {
      // setup test data
      const existingRecords = [
        generateExistingRecord('existing_record_id', {
          deletedAt: new Date(),
          status: 'historical',
        }),
      ];
      mockExistingRecords(existingRecords);
      const newRecord = { id: 'existing_record_id', deletedAt: new Date(), status: 'current' };
      const changes = [{ data: newRecord, isDeleted: !!newRecord.deletedAt }];
      // act
      await saveChangesForModel(Model, changes, true);
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
    });
  });

  describe('saveDeletes', () => {
    it('should delete records correctly', async () => {
      // setup test data
      const existingRecords = [generateExistingRecord('existing_record_id')];
      mockExistingRecords(existingRecords);
      const newRecord = { id: 'existing_record_id', deletedAt: new Date() };
      const changes = [{ data: newRecord, isDeleted: !!newRecord.deletedAt }];
      // act
      await saveChangesForModel(Model, changes, true);
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toBeCalledWith(
        Model,
        [newRecord],
        expect.anything(),
        true,
      );
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
    });
  });

  describe('saveRestore', () => {
    it('should restore records correctly', async () => {
      // setup test data
      const existingRecords = [
        generateExistingRecord('existing_record_id', { deletedAt: new Date() }),
      ];
      mockExistingRecords(existingRecords);
      const newRecord = { id: 'existing_record_id', deletedAt: null };
      const changes = [{ data: newRecord, isDeleted: !!newRecord.deletedAt }];
      // act
      await saveChangesForModel(Model, changes, true);
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(1);
      expect(saveChangeModules.saveRestores).toBeCalledWith(
        Model,
        [newRecord],
        expect.anything(),
        true,
      );
    });
  });
});
