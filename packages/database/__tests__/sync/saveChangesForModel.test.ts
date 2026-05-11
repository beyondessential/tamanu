import { INVOICE_ITEMS_CATEGORIES, INVOICE_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
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
      await saveChangesForModel(models.SurveyScreenComponent, changes, true, log);
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

  // Sequelize bulk hooks on bidirectional models (e.g. PharmacyOrderPrescription's
  // afterBulkCreate, which calls Invoice.addItemToInvoice) must not run while sync
  // is replaying the canonical state from the snapshot. If they do, the hook may
  // create a competing invoice_items row with a freshly generated id, racing with
  // sync's own incoming invoice_items row for the same source values and tripping
  // the (invoice_id, source_record_type, source_record_id) unique constraint.
  describe('skips Sequelize hooks during sync persistence', () => {
    let invoice;
    let prescription;
    let pharmacyOrder;

    beforeAll(async () => {
      const user = await models.User.create(fake(models.User));
      const facility = await models.Facility.create(fake(models.Facility));
      const patient = await models.Patient.create(fake(models.Patient));
      const locationGroup = await models.LocationGroup.create(
        fake(models.LocationGroup, { facilityId: facility.id }),
      );
      const location = await models.Location.create(
        fake(models.Location, { facilityId: facility.id, locationGroupId: locationGroup.id }),
      );
      const department = await models.Department.create(
        fake(models.Department, { facilityId: facility.id }),
      );
      const encounter = await models.Encounter.create(
        fake(models.Encounter, {
          patientId: patient.id,
          locationId: location.id,
          departmentId: department.id,
          examinerId: user.id,
        }),
      );
      // In-progress invoice required for Invoice.addItemToInvoice to attempt an upsert.
      invoice = await models.Invoice.create(
        fake(models.Invoice, {
          encounterId: encounter.id,
          status: INVOICE_STATUSES.IN_PROGRESS,
        }),
      );
      const drug = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
      );
      // The DRUG-category InvoiceProduct is what the prescription hook would resolve.
      await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.DRUG,
          sourceRecordType: 'ReferenceData',
          sourceRecordId: drug.id,
        }),
      );
      prescription = await models.Prescription.create(
        fake(models.Prescription, {
          medicationId: drug.id,
          prescriberId: user.id,
        }),
      );
      await models.EncounterPrescription.create(
        fake(models.EncounterPrescription, {
          encounterId: encounter.id,
          prescriptionId: prescription.id,
        }),
      );
      // Discharge pharmacy order is the gate that makes the hook attempt to add an invoice item.
      pharmacyOrder = await models.PharmacyOrder.create(
        fake(models.PharmacyOrder, {
          encounterId: encounter.id,
          orderingClinicianId: user.id,
          facilityId: facility.id,
          isDischargePrescription: true,
        }),
      );
    });

    afterEach(async () => {
      await models.InvoiceItem.destroy({ where: {}, force: true });
      await models.PharmacyOrderPrescription.destroy({ where: {}, force: true });
    });

    it('does not create invoice_items when persisting a pharmacy_order_prescription via sync', async () => {
      const popData = {
        ...fake(models.PharmacyOrderPrescription, {
          pharmacyOrderId: pharmacyOrder.id,
          prescriptionId: prescription.id,
          quantity: 5,
        }),
      };

      await saveChangesForModel(
        models.PharmacyOrderPrescription,
        [{ data: popData, isDeleted: false }],
        false,
        log,
      );

      const persistedPop = await models.PharmacyOrderPrescription.findByPk(popData.id);
      expect(persistedPop).not.toBeNull();
      expect(persistedPop.quantity).toBe(5);

      // The afterBulkCreate hook would otherwise upsert an invoice_items row here via
      // recalculateAndApplyInvoiceQuantity -> Invoice.addItemToInvoice. With hooks
      // disabled on the sync persist path, it must not fire.
      const invoiceItems = await models.InvoiceItem.findAll({
        where: { invoiceId: invoice.id },
        paranoid: false,
      });
      expect(invoiceItems).toHaveLength(0);
    });

    it('does not create invoice_items when updating a pharmacy_order_prescription via sync', async () => {
      const existing = await models.PharmacyOrderPrescription.create(
        fake(models.PharmacyOrderPrescription, {
          pharmacyOrderId: pharmacyOrder.id,
          prescriptionId: prescription.id,
          quantity: 1,
        }),
      );
      // Clear any invoice items that may have been created by the local create above,
      // so we're only asserting on what sync persistence does.
      await models.InvoiceItem.destroy({ where: {}, force: true });

      await saveChangesForModel(
        models.PharmacyOrderPrescription,
        [
          {
            data: { ...existing.get({ plain: true }), quantity: 7 },
            isDeleted: false,
          },
        ],
        false,
        log,
      );

      const reloaded = await models.PharmacyOrderPrescription.findByPk(existing.id);
      expect(reloaded.quantity).toBe(7);

      const invoiceItems = await models.InvoiceItem.findAll({
        where: { invoiceId: invoice.id },
        paranoid: false,
      });
      expect(invoiceItems).toHaveLength(0);
    });
  });
});
