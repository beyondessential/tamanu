import { saveChangesForModel } from '../../src/sync';
import * as saveChangeModules from '../../src/sync/saveChanges';
import { closeDatabase, createTestDatabase } from './utilities';

jest.mock('../../src/sync/saveChanges', () => ({
  __esModule: true,
  ...jest.requireActual('../../src/sync/saveChanges'),
}));

jest.spyOn(saveChangeModules, 'saveCreates');
jest.spyOn(saveChangeModules, 'saveUpdates');
jest.spyOn(saveChangeModules, 'saveDeletes');
jest.spyOn(saveChangeModules, 'saveRestores');

describe('saveChangesForModel', () => {
  let models;

  beforeAll(async () => {
    const database = await createTestDatabase();
    models = database.models;
  });

  afterEach(async () => {
    await models.SurveyScreenComponent.destroy({ truncate: true, force: true });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('saveCreates', () => {
    it('should create new records correctly', async () => {
      // setup test data
      const newRecord = { id: 'new_record_id', text: 'new_record_name' };
      const isDeleted = false;
      const changes = [{ data: newRecord, isDeleted }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, {
        persistUpdateWorkerPoolSize: 5,
      });
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(1);
      expect(saveChangeModules.saveCreates).toBeCalledWith(models.SurveyScreenComponent, [
        { ...newRecord, isDeleted }, // isDeleted flag for soft deleting record after creation
      ]);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);

      const newRecordInDb = await models.SurveyScreenComponent.findByPk('new_record_id');
      expect(newRecordInDb).toBeDefined();
      expect(newRecordInDb.text).toEqual(newRecord.text);
    });

    it('should create new records even if they are soft deleted', async () => {
      // setup test data
      const newRecord = { id: 'new_record_id', text: 'new_record_name' }; // does not pass down deletedAt from central
      const isDeleted = true;
      const changes = [{ data: newRecord, isDeleted }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, {
        persistUpdateWorkerPoolSize: 5,
      });
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(1);
      expect(saveChangeModules.saveCreates).toBeCalledWith(models.SurveyScreenComponent, [
        { ...newRecord, isDeleted }, // isDeleted flag for soft deleting record after creation
      ]);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);

      const newRecordInDb = await models.SurveyScreenComponent.findByPk(newRecord.id, {
        paranoid: false,
      });
      expect(newRecordInDb).toBeDefined();
      expect(newRecordInDb.text).toEqual(newRecord.text);
    });
  });

  describe('saveUpdates', () => {
    it('should update existing records correctly', async () => {
      // setup test data
      const existingRecord = { id: 'existing_record_id', text: 'historical' };
      await models.SurveyScreenComponent.create(existingRecord);
      const newRecord = { id: existingRecord.id, text: 'current' };
      const changes = [{ data: newRecord, isDeleted: false }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, {
        persistUpdateWorkerPoolSize: 5,
      });
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.saveUpdates).toBeCalledWith(
        models.SurveyScreenComponent,
        [newRecord],
        expect.anything(),
        true,
      );
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id);
      expect(updatedRecordInDb).toBeDefined();
      expect(updatedRecordInDb.text).toEqual(newRecord.text);
    });

    it('should update soft deleted records', async () => {
      // setup test data
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      await existingRecord.destroy();
      const newRecord = { id: existingRecord.id, text: 'current' };
      const changes = [{ data: newRecord, isDeleted: true }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, {
        persistUpdateWorkerPoolSize: 5,
      });
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(updatedRecordInDb).toBeDefined();
      expect(updatedRecordInDb.text).toEqual(newRecord.text);
    });
  });

  describe('saveDeletes', () => {
    it('should update record, then delete record in saveDeletes()', async () => {
      // setup test data
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      const newRecord = { id: existingRecord.id, text: 'current' };
      const changes = [{ data: newRecord, isDeleted: true }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, {
        persistUpdateWorkerPoolSize: 5,
      });
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toBeCalledWith(models.SurveyScreenComponent, [
        newRecord,
      ]);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(0);
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(updatedRecordInDb.deletedAt).toBeDefined();
      expect(updatedRecordInDb.text).toBe(newRecord.text);
    });
  });

  describe('saveRestore', () => {
    it('should restore records,then update record in saveRestore()', async () => {
      // setup test data
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      await existingRecord.destroy();
      const newRecord = { id: existingRecord.id, text: 'current' };
      const changes = [{ data: newRecord, isDeleted: false }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, {
        persistUpdateWorkerPoolSize: 5,
      });
      // assertions
      expect(saveChangeModules.saveCreates).toBeCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toBeCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toBeCalledTimes(0);
      expect(saveChangeModules.saveRestores).toBeCalledTimes(1);
      expect(saveChangeModules.saveRestores).toBeCalledWith(models.SurveyScreenComponent, [
        newRecord,
      ]);
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id);
      expect(updatedRecordInDb).toBeDefined();
      expect(updatedRecordInDb.text).toEqual(newRecord.text);
    });
  });
});
