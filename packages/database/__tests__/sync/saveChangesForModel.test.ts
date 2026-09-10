import { INVOICE_ITEMS_CATEGORIES, INVOICE_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { log } from '@tamanu/shared/services/logging/log';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants/facts';
import { saveChangesForModel, SYNC_TICK_FLAGS } from '../../src/sync';
import * as saveChangeModules from '../../src/sync/saveChanges';
import { closeDatabase, createTestDatabase } from '../utilities';
import { describe, expect, it, vitest, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

vitest.mock('../../src/sync/saveChanges', async () => ({
  __esModule: true,
  ...(await vitest.importActual('../../src/sync/saveChanges')),
}));

vitest.spyOn(saveChangeModules, 'saveCreates');
vitest.spyOn(saveChangeModules, 'saveUpdates');

// the sync tick the set_updated_at_sync_tick trigger stamps on any write that does not carry the
// INCOMING_FROM_CENTRAL_SERVER sentinel
const CURRENT_SYNC_TICK = 42;

describe('saveChangesForModel', () => {
  let models;

  beforeAll(async () => {
    const database = await createTestDatabase();
    models = database.models;
  });

  beforeEach(async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, CURRENT_SYNC_TICK.toString());
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

      const newRecordInDb = await models.SurveyScreenComponent.findByPk(newRecord.id, {
        paranoid: false,
      });
      expect(newRecordInDb).toBeDefined();
      expect(newRecordInDb.text).toEqual(newRecord.text);
      expect(newRecordInDb.deletedAt).not.toBeNull();
      expect(Number.parseInt(newRecordInDb.updatedAtSyncTick, 10)).toBe(CURRENT_SYNC_TICK);
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
      // no restore decision, so deleted_at is left alone
      expect(saveChangeModules.saveUpdates).toBeCalledWith(
        models.SurveyScreenComponent,
        [newRecord],
        expect.anything(),
        true,
      );
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(updatedRecordInDb).toBeDefined();
      expect(updatedRecordInDb.deletedAt).not.toBeNull();
      expect(updatedRecordInDb.text).toEqual(newRecord.text);
    });
  });

  describe('soft deletes', () => {
    it('should update and soft delete the record in a single write', async () => {
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
      // the delete rides along on the update, so deleted_at and the tick land in one statement
      expect(saveChangeModules.saveUpdates).toBeCalledWith(
        models.SurveyScreenComponent,
        [{ ...newRecord, deletedAt: expect.objectContaining({ fn: 'now' }) }],
        expect.anything(),
        true,
      );
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(updatedRecordInDb.deletedAt).not.toBeNull();
      expect(updatedRecordInDb.text).toBe(newRecord.text);
      // on central the delete is a change that still has to reach other devices, so it is stamped
      // with the current tick like any other write
      expect(Number.parseInt(updatedRecordInDb.updatedAtSyncTick, 10)).toBe(CURRENT_SYNC_TICK);
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
      expect(saveChangeModules.saveUpdates).toBeCalledWith(
        models.SurveyScreenComponent,
        [{ ...newRecord, deletedAt: null }],
        expect.anything(),
        false,
      );
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
      // no restore decision, so deleted_at is left alone
      expect(saveChangeModules.saveUpdates).toBeCalledWith(
        models.SurveyScreenComponent,
        [newRecord],
        expect.anything(),
        true,
      );
      const updatedRecordInDb = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(updatedRecordInDb).toBeDefined();
      expect(updatedRecordInDb.deletedAt).not.toBeNull();
      expect(updatedRecordInDb.text).toEqual(newRecord.text);
    });
  });

  // On central, saveUpdates merges the incoming record with the existing one field by field using
  // updated_at_by_field. deleted_at isn’t tracked there, so left to the merge the existing (null)
  // value would win and the delete would be silently dropped — the caller’s decision has to win.
  describe('soft deletes on central for models with updated_at_by_field', () => {
    it('soft deletes the record even though the field-wise merge would keep it', async () => {
      const patient = await models.Patient.create(fake(models.Patient));
      const additionalData = await models.PatientAdditionalData.create(
        fake(models.PatientAdditionalData, { patientId: patient.id, placeOfBirth: 'Here' }),
      );
      await additionalData.reload();
      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        deletedAt: _deletedAt,
        updatedAtSyncTick: _tick,
        ...pushedAdditionalData
      } = additionalData.get({ plain: true });
      // the field-wise merge only runs when both sides carry updated_at_by_field
      expect(pushedAdditionalData.updatedAtByField).toBeTruthy();
      // a newer per-field tick so the field change wins the merge too; deleted_at has no such
      // tick, which is exactly why it needs the override under test
      const changes = [
        {
          data: {
            ...pushedAdditionalData,
            placeOfBirth: 'There',
            updatedAtByField: {
              ...pushedAdditionalData.updatedAtByField,
              place_of_birth: CURRENT_SYNC_TICK + 1,
            },
          },
          isDeleted: true,
        },
      ];

      await saveChangesForModel(models.PatientAdditionalData, changes, true, log);

      const deleted = await models.PatientAdditionalData.findByPk(additionalData.id, {
        paranoid: false,
      });
      expect(deleted.deletedAt).not.toBeNull();
      expect(deleted.placeOfBirth).toBe('There');
      expect(Number(deleted.updatedAtSyncTick)).toBe(CURRENT_SYNC_TICK);

      await models.PatientAdditionalData.destroy({ where: { id: additionalData.id }, force: true });
      await models.Patient.destroy({ where: { id: patient.id }, force: true });
    });
  });

  // Records pulled from central are marked with INCOMING_FROM_CENTRAL_SERVER (-1), which the
  // set_updated_at_sync_tick trigger stores as LAST_UPDATED_ELSEWHERE (-999) so the facility never
  // pushes them back. The tick has to be written in the same statement as deleted_at — a paranoid
  // destroy()/restore() leaves it out, and the trigger then stamps the current tick instead, which
  // made facilities echo every bulk delete on central straight back to it.
  describe('sync tick of records persisted from a central pull (facility server)', () => {
    const incomingFromCentral = data => ({
      ...data,
      updatedAtSyncTick: SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER,
    });
    const expectNotPushable = record =>
      expect(Number(record.updatedAtSyncTick)).toBe(SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE);

    it('marks a pulled delete as last updated elsewhere', async () => {
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      expect(Number(existingRecord.updatedAtSyncTick)).toBe(CURRENT_SYNC_TICK);
      const changes = [
        { data: incomingFromCentral({ id: existingRecord.id, text: 'current' }), isDeleted: true },
      ];

      await saveChangesForModel(models.SurveyScreenComponent, changes, false, log);

      const deletedRecord = await models.SurveyScreenComponent.findByPk(existingRecord.id, {
        paranoid: false,
      });
      expect(deletedRecord.deletedAt).not.toBeNull();
      expect(deletedRecord.text).toBe('current');
      expectNotPushable(deletedRecord);
    });

    it('marks a pulled restore as last updated elsewhere', async () => {
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      await existingRecord.destroy();
      const changes = [
        { data: incomingFromCentral({ id: existingRecord.id, text: 'current' }), isDeleted: false },
      ];

      await saveChangesForModel(models.SurveyScreenComponent, changes, false, log);

      const restoredRecord = await models.SurveyScreenComponent.findByPk(existingRecord.id);
      expect(restoredRecord).not.toBeNull();
      expect(restoredRecord.deletedAt).toBeNull();
      expect(restoredRecord.text).toBe('current');
      expectNotPushable(restoredRecord);
    });

    it('marks a pulled soft-deleted create as last updated elsewhere', async () => {
      const changes = [
        {
          data: incomingFromCentral({ id: 'new_record_id', text: 'new_record_name' }),
          isDeleted: true,
        },
      ];

      await saveChangesForModel(models.SurveyScreenComponent, changes, false, log);

      const newRecord = await models.SurveyScreenComponent.findByPk('new_record_id', {
        paranoid: false,
      });
      expect(newRecord).not.toBeNull();
      expect(newRecord.deletedAt).not.toBeNull();
      expectNotPushable(newRecord);
    });

    it('marks a pulled update as last updated elsewhere', async () => {
      const existingRecord = await models.SurveyScreenComponent.create({
        id: 'existing_record_id',
        text: 'historical',
      });
      const changes = [
        { data: incomingFromCentral({ id: existingRecord.id, text: 'current' }), isDeleted: false },
      ];

      await saveChangesForModel(models.SurveyScreenComponent, changes, false, log);

      const updatedRecord = await models.SurveyScreenComponent.findByPk(existingRecord.id);
      expect(updatedRecord.text).toBe('current');
      expectNotPushable(updatedRecord);
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

  // Pins the prepareSanitizeContext -> sanitizeForFacilityServer wiring itself, on a
  // plain model (ReferenceDrugFacility's real mSupply logic has its own dedicated test).
  describe('sanitize context: resolved once per batch, threaded into the per-record hook', () => {
    it('calls prepareSanitizeContext once and passes its result into sanitizeForFacilityServer for every record', async () => {
      const prepareSpy = vitest
        .spyOn(models.SurveyScreenComponent, 'prepareSanitizeContext')
        .mockResolvedValue('context-value');
      const sanitizeSpy = vitest.spyOn(models.SurveyScreenComponent, 'sanitizeForFacilityServer');

      const changes = [
        { data: { id: 'ssc-1', text: 'a' }, isDeleted: false },
        { data: { id: 'ssc-2', text: 'b' }, isDeleted: false },
      ];

      await saveChangesForModel(models.SurveyScreenComponent, changes, false, log);

      expect(prepareSpy).toHaveBeenCalledTimes(1);
      expect(prepareSpy).toHaveBeenCalledWith(changes);
      expect(sanitizeSpy).toHaveBeenCalledTimes(2);
      expect(sanitizeSpy).toHaveBeenCalledWith({ id: 'ssc-1', text: 'a' }, 'context-value');
      expect(sanitizeSpy).toHaveBeenCalledWith({ id: 'ssc-2', text: 'b' }, 'context-value');

      prepareSpy.mockRestore();
      sanitizeSpy.mockRestore();
    });
  });
});
