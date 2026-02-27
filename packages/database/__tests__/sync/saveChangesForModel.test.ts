import { log } from '@tamanu/shared/services/logging/log';
import { saveChangesForModel } from '../../src/sync';
import * as saveChangeModules from '../../src/sync/saveChanges';
import { closeDatabase, createTestDatabase } from '../utilities';
import { describe, expect, it, vitest, beforeAll, afterEach, afterAll } from 'vitest';

vitest.mock('../../src/sync/saveChanges', async () => ({
  __esModule: true,
  ...(await vitest.importActual('../../src/sync/saveChanges')),
}));

vitest.spyOn(saveChangeModules, 'saveCreates');
vitest.spyOn(saveChangeModules, 'saveUpdates');
vitest.spyOn(saveChangeModules, 'saveDeletes');
vitest.spyOn(saveChangeModules, 'saveRestores');

describe('saveChangesForModel', () => {
  let models;

  beforeAll(async () => {
    const database = await createTestDatabase();
    models = database.models;
  });

  afterEach(async () => {
    await models.SurveyScreenComponent.destroy({ truncate: true, force: true });
    vitest.clearAllMocks();
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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
      // assertions
      expect(saveChangeModules.saveCreates).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveCreates).toHaveBeenCalledWith(models.SurveyScreenComponent, [
        { ...newRecord, isDeleted }, // isDeleted flag for soft deleting record after creation
      ]);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledTimes(0);

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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
      // assertions
      expect(saveChangeModules.saveCreates).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveCreates).toHaveBeenCalledWith(models.SurveyScreenComponent, [
        { ...newRecord, isDeleted }, // isDeleted flag for soft deleting record after creation
      ]);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledTimes(0);

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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
      // assertions
      expect(saveChangeModules.saveCreates).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledWith(
        models.SurveyScreenComponent,
        [newRecord],
        expect.anything(),
        true,
      );
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledTimes(0);
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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
      // assertions
      expect(saveChangeModules.saveCreates).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledTimes(0);
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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
      // assertions
      expect(saveChangeModules.saveCreates).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledWith(models.SurveyScreenComponent, [
        newRecord,
      ]);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledTimes(0);
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(updatedRecordInDb.deletedAt).toBeDefined();
      expect(updatedRecordInDb.text).toBe(newRecord.text);
    });
  });

  describe('saveRestore', () => {
    it('should restore records in facility server and also update them', async () => {
      // setup test data
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      await existingRecord.destroy();
      const newRecord = { id: existingRecord.id, text: 'current' };
      const changes = [{ data: newRecord, isDeleted: false }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, false, log);
      // assertions
      expect(saveChangeModules.saveCreates).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledWith(models.SurveyScreenComponent, [
        newRecord,
      ]);
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id);
      expect(updatedRecordInDb).toBeDefined();
      expect(updatedRecordInDb.text).toEqual(newRecord.text);
    });

    it('should NOT restore records in central server, however they should still be updated', async () => {
      // setup test data
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      await existingRecord.destroy();
      const newRecord = { id: existingRecord.id, text: 'current' };
      const changes = [{ data: newRecord, isDeleted: false }];
      // act
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
      // assertions
      expect(saveChangeModules.saveCreates).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveUpdates).toHaveBeenCalledTimes(1);
      expect(saveChangeModules.saveDeletes).toHaveBeenCalledTimes(0);
      expect(saveChangeModules.saveRestores).toHaveBeenCalledTimes(0);
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(updatedRecordInDb).toBeDefined();
      expect(updatedRecordInDb.text).toEqual(newRecord.text);
    });
  });
});
