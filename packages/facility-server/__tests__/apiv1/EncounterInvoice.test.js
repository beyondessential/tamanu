import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { describe } from 'node:test';

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
    await models.InvoicesInvoiceInsurancePlan.truncate();
    await models.InvoiceInsurancePlanItem.truncate();
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
            insurancePlanItems: [],
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

  describe('Insurance plan items', () => {
    it('should include insurance plan items with default coverage for invoice items', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // Create insurance plan with default coverage
      const insurancePlan = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-001',
        name: 'Basic Plan',
        defaultCoverage: 80,
      });

      // Create invoice and link insurance plan
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-456',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan.id,
      });

      // Create procedure and invoice product
      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Procedure 2',
          code: 'PROC-2',
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
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0]).toMatchObject({
        sourceRecordId: procedure.id,
        productId: invoiceProduct.id,
        insurancePlanItems: [
          {
            id: insurancePlan.id,
            code: 'PLAN-001',
            name: 'Basic Plan',
            label: 'Basic Plan',
            coverageValue: '80',
          },
        ],
      });
    });

    it('should include insurance plan items with custom coverage values', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // Create insurance plan
      const insurancePlan = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-002',
        name: 'Premium Plan',
        defaultCoverage: 90,
      });

      // Create invoice and link insurance plan
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-789',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan.id,
      });

      // Create procedure and invoice product
      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Procedure 3',
          code: 'PROC-3',
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

      // Create custom coverage for this specific product
      await models.InvoiceInsurancePlanItem.create({
        invoiceInsurancePlanId: insurancePlan.id,
        invoiceProductId: invoiceProduct.id,
        coverageValue: 95,
      });

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
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0]).toMatchObject({
        sourceRecordId: procedure.id,
        productId: invoiceProduct.id,
        insurancePlanItems: [
          {
            id: insurancePlan.id,
            code: 'PLAN-002',
            name: 'Premium Plan',
            label: 'Premium Plan',
            coverageValue: '95', // Should use custom coverage instead of default
          },
        ],
      });
    });

    it('should include multiple insurance plans for a single invoice', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // Create multiple insurance plans
      const insurancePlan1 = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-PRIMARY',
        name: 'Primary Insurance',
        defaultCoverage: 80,
      });

      const insurancePlan2 = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-SECONDARY',
        name: 'Secondary Insurance',
        defaultCoverage: 50,
      });

      // Create invoice and link both insurance plans
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-999',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan1.id,
      });

      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: insurancePlan2.id,
      });

      // Create procedure and invoice product
      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Procedure 4',
          code: 'PROC-4',
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

      // Create custom coverage for second plan only
      await models.InvoiceInsurancePlanItem.create({
        invoiceInsurancePlanId: insurancePlan2.id,
        invoiceProductId: invoiceProduct.id,
        coverageValue: 60,
      });

      await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const result = await app.get(`/api/encounter/${encounter.id}/invoice`);
      expect(result).toHaveSucceeded();
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0].insurancePlanItems).toHaveLength(2);

      // Check both insurance plans are present
      const insurancePlanItems = result.body.items[0].insurancePlanItems;
      const primaryPlan = insurancePlanItems.find(item => item.code === 'PLAN-PRIMARY');
      const secondaryPlan = insurancePlanItems.find(item => item.code === 'PLAN-SECONDARY');

      expect(primaryPlan).toMatchObject({
        id: insurancePlan1.id,
        code: 'PLAN-PRIMARY',
        name: 'Primary Insurance',
        label: 'Primary Insurance',
        coverageValue: '80', // Default coverage
      });

      expect(secondaryPlan).toMatchObject({
        id: insurancePlan2.id,
        code: 'PLAN-SECONDARY',
        name: 'Secondary Insurance',
        label: 'Secondary Insurance',
        coverageValue: '60', // Custom coverage
      });
    });
  });
});
