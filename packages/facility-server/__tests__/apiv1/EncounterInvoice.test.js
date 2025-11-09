import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';

describe('Encounter invoice', () => {
  let patient = null;
  let user = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await baseApp.asUser(user);
  });

  beforeEach(async () => {
    await models.Encounter.truncate();
    await models.Invoice.truncate();
    await models.InvoiceItem.truncate();
  });

  afterAll(() => ctx.close());

  describe('GET encounter invoice', () => {
    it('should get the invoice for an encounter', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-123',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });
      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        displayId: 'INV-123',
        encounterId: encounter.id,
        status: INVOICE_STATUSES.IN_PROGRESS,
        items: [],
      });
    });
  });

  describe('Automatically added items', () => {
    it('should automatically add/remove items to the invoice when a procedure is created/deleted', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-123',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });
      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Procedure 1',
          code: 'PROC-1',
        }),
      );
      const invoiceProduct = await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
          sourceRecordType:
            INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
          sourceRecordId: procedureType.id,
        }),
      );
      const procedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        displayId: 'INV-123',
        encounterId: encounter.id,
        status: INVOICE_STATUSES.IN_PROGRESS,
        items: [
          {
            sourceRecordId: procedure.id,
            sourceRecordType: procedure.getModelName(),
            productId: invoiceProduct.id,
            orderedByUserId: user.id,
            quantity: 1,
          },
        ],
      });

      await procedure.destroy();

      const result2 = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result2).toHaveSucceeded();
      expect(result2.body).toMatchObject({
        displayId: 'INV-123',
        encounterId: encounter.id,
        status: INVOICE_STATUSES.IN_PROGRESS,
        items: [],
      });
    });
  });
});
