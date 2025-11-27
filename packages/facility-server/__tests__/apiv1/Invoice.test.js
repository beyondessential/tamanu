import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import {
  INVOICE_STATUSES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { beforeEach, describe } from 'node:test';

describe('Invoice API', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let user = null;
  let patient = null;
  let priceList = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, {
        name: 'Standard Price List',
        code: 'STANDARD',
      }),
    );
    app = await baseApp.asUser(user);
  });

  beforeEach(async () => {
    await models.Encounter.truncate();
    await models.Invoice.truncate();
    await models.InvoiceItem.truncate();
    await models.InvoiceItemFinalisedInsurance.truncate();
    await models.InvoicesInvoiceInsurancePlan.truncate();
    await models.InvoiceInsurancePlanItem.truncate();
    await models.InvoicePriceList.truncate();
    await models.InvoicePriceListItem.truncate();
  });

  afterAll(() => ctx.close());

  describe('PUT /:id/finalise', () => {
    it('should successfully finalise an in-progress invoice', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-FINALISE-001',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        id: invoice.id,
        status: INVOICE_STATUSES.FINALISED,
      });

      // Verify status was persisted in database
      const updatedInvoice = await models.Invoice.findByPk(invoice.id);
      expect(updatedInvoice.status).toBe(INVOICE_STATUSES.FINALISED);
    });

    it('should freeze invoice item product details when finalising', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Surgery',
          code: 'SURG-001',
        }),
      );

      const invoiceProduct = await models.InvoiceProduct.create(
        fake(models.InvoiceProduct, {
          category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
          sourceRecordType:
            INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
          sourceRecordId: procedureType.id,
          name: 'Surgery Product',
        }),
      );

      await models.InvoicePriceListItem.create({
        invoicePriceListId: priceList.id,
        invoiceProductId: invoiceProduct.id,
        price: 150.5,
      });

      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-FINALISE-002',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      const procedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const invoiceItem = await models.InvoiceItem.create({
        invoiceId: invoice.id,
        productId: invoiceProduct.id,
        sourceId: procedure.id,
        orderDate: new Date(),
        orderedByUserId: user.id,
        quantity: 2,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();

      // Verify finalised fields are populated
      const finalisedItem = await models.InvoiceItem.findByPk(invoiceItem.id);
      expect(finalisedItem.productNameFinal).toBe('Surgery Product');
      expect(finalisedItem.productCodeFinal).toBe('SURG-001');
      expect(finalisedItem.priceFinal).toBe('150.5');
    });

    it('should use manual entry price when price list item is not available', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Custom Procedure',
          code: 'CUSTOM-001',
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

      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-FINALISE-003',
        date: new Date(),
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      const procedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const manualPrice = 99.99;
      const invoiceItem = await models.InvoiceItem.create({
        invoiceId: invoice.id,
        productId: invoiceProduct.id,
        sourceId: procedure.id,
        orderDate: new Date(),
        orderedByUserId: user.id,
        quantity: 1,
        manualEntryPrice: manualPrice,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();

      // Verify manual price is used
      const finalisedItem = await models.InvoiceItem.findByPk(invoiceItem.id);
      expect(finalisedItem.priceFinal).toBe('99.99');
    });

    it('should save insurance plan coverage values to InvoiceItemFinalisedInsurance', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const insurancePlan1 = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-001',
        name: 'Primary Insurance',
        defaultCoverage: 80,
      });

      const insurancePlan2 = await models.InvoiceInsurancePlan.create({
        code: 'PLAN-002',
        name: 'Secondary Insurance',
        defaultCoverage: 50,
      });

      const procedureType = await models.ReferenceData.create(
        fake(models.ReferenceData, {
          type: REFERENCE_TYPES.PROCEDURE_TYPE,
          name: 'Consultation',
          code: 'CONSULT-001',
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

      await models.InvoicePriceListItem.create({
        invoicePriceListId: priceList.id,
        invoiceProductId: invoiceProduct.id,
        price: 100,
      });

      await models.InvoiceInsurancePlanItem.create({
        invoiceInsurancePlanId: insurancePlan1.id,
        invoiceProductId: invoiceProduct.id,
        coverageValue: 90,
      });

      await models.InvoiceInsurancePlanItem.create({
        invoiceInsurancePlanId: insurancePlan2.id,
        invoiceProductId: invoiceProduct.id,
        coverageValue: 60,
      });

      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-FINALISE-004',
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

      const procedure = await models.Procedure.create(
        fake(models.Procedure, {
          encounterId: encounter.id,
          procedureTypeId: procedureType.id,
          date: new Date(),
          physicianId: user.id,
        }),
      );

      const invoiceItem = await models.InvoiceItem.create({
        invoiceId: invoice.id,
        productId: invoiceProduct.id,
        sourceId: procedure.id,
        orderDate: new Date(),
        orderedByUserId: user.id,
        quantity: 1,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();

      // Verify insurance coverage was saved
      const finalisedInsurances = await models.InvoiceItemFinalisedInsurance.findAll({
        where: { invoiceItemId: invoiceItem.id },
      });

      expect(finalisedInsurances).toHaveLength(2);

      const insurances = finalisedInsurances.sort(
        (a, b) => a.coverageValueFinal - b.coverageValueFinal,
      );

      expect(insurances[0].invoiceItemId).toEqual(invoiceItem.id);
      expect(insurances[0].invoiceInsurancePlanId).toEqual(insurancePlan2.id);
      expect(insurances[0].coverageValueFinal).toEqual('60');

      expect(insurances[1].invoiceItemId).toEqual(invoiceItem.id);
      expect(insurances[1].invoiceInsurancePlanId).toEqual(insurancePlan1.id);
      expect(insurances[1].coverageValueFinal).toEqual('90');
    });

    it('should return error when trying to finalise a non-existent invoice', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await app.put(`/api/invoices/${nonExistentId}/finalise`);

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('Invoice not found');
    });

    it('should return error when trying to finalise a cancelled invoice', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-FINALISE-005',
        date: new Date(),
        status: INVOICE_STATUSES.CANCELLED,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toContain('Only in progress invoices can be finalised');
    });

    it('should return error when trying to finalise an already finalised invoice', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
      const invoice = await models.Invoice.create({
        encounterId: encounter.id,
        displayId: 'INV-FINALISE-006',
        date: new Date(),
        status: INVOICE_STATUSES.FINALISED,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toContain('Only in progress invoices can be finalised');
    });
  });
});
