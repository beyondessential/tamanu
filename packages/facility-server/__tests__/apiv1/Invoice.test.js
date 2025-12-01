import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import {
  INVOICE_STATUSES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';

describe('Invoice API', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let user = null;
  let patient = null;
  let priceList = null;

  const createEncounter = async () =>
    models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

  const createInvoice = async (encounterId, overrides = {}) =>
    models.Invoice.create({
      encounterId,
      displayId: overrides.displayId || `INV-${Date.now()}`,
      date: new Date(),
      status: INVOICE_STATUSES.IN_PROGRESS,
      ...overrides,
    });

  const createProcedureType = async (overrides = {}) =>
    models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: REFERENCE_TYPES.PROCEDURE_TYPE,
        name: 'Test Procedure',
        code: `PROC-${Date.now()}`,
        ...overrides,
      }),
    );

  const createInvoiceProduct = async (procedureType, overrides = {}) =>
    models.InvoiceProduct.create(
      fake(models.InvoiceProduct, {
        category: INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE,
        sourceRecordType: INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.PROCEDURE_TYPE],
        sourceRecordId: procedureType.id,
        ...overrides,
      }),
    );

  const createProcedure = async (encounterId, procedureTypeId) =>
    models.Procedure.create(
      fake(models.Procedure, {
        encounterId,
        procedureTypeId,
        date: new Date(),
        physicianId: user.id,
      }),
    );

  const createInvoiceItem = async (invoiceId, productId, sourceRecordId, overrides = {}) =>
    models.InvoiceItem.create({
      invoiceId,
      productId,
      sourceRecordId,
      orderDate: new Date(),
      orderedByUserId: user.id,
      quantity: 1,
      ...overrides,
    });

  const createInsurancePlan = async (code, name, defaultCoverage) =>
    models.InvoiceInsurancePlan.create({
      code,
      name,
      defaultCoverage,
    });

  const linkInsurancePlanToInvoice = async (invoiceId, insurancePlanId) =>
    models.InvoicesInvoiceInsurancePlan.create({
      invoiceId,
      invoiceInsurancePlanId: insurancePlanId,
    });

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
    const tablesToClean = [
      'Encounter',
      'Invoice',
      'InvoiceItem',
      'InvoiceItemFinalisedInsurance',
      'InvoicesInvoiceInsurancePlan',
      'InvoiceInsurancePlanItem',
      'InvoicePriceListItem',
    ];
    await Promise.all(tablesToClean.map(table => models[table].truncate()));
  });

  afterAll(() => ctx.close());

  describe('PUT /:id/finalise', () => {
    it('should successfully finalise an in-progress invoice', async () => {
      const encounter = await createEncounter();
      const invoice = await createInvoice(encounter.id, { displayId: 'INV-FINALISE-001' });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        id: invoice.id,
        status: INVOICE_STATUSES.FINALISED,
      });

      const updatedInvoice = await models.Invoice.findByPk(invoice.id);
      expect(updatedInvoice.status).toBe(INVOICE_STATUSES.FINALISED);
    });

    it('should freeze invoice item product details when finalising', async () => {
      const encounter = await createEncounter();
      const procedureType = await createProcedureType({
        name: 'Surgery',
        code: 'SURG-001',
      });
      const invoiceProduct = await createInvoiceProduct(procedureType, {
        name: 'Surgery Product',
      });

      await models.InvoicePriceListItem.create({
        invoicePriceListId: priceList.id,
        invoiceProductId: invoiceProduct.id,
        price: 150.5,
      });

      const invoice = await createInvoice(encounter.id, { displayId: 'INV-FINALISE-002' });
      const procedure = await createProcedure(encounter.id, procedureType.id);
      const invoiceItem = await createInvoiceItem(invoice.id, invoiceProduct.id, procedure.id, {
        quantity: 2,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();

      const finalisedItem = await models.InvoiceItem.findByPk(invoiceItem.id);
      expect(finalisedItem.productNameFinal).toBe('Surgery Product');
      expect(finalisedItem.productCodeFinal).toBe('SURG-001');
      expect(finalisedItem.priceFinal).toBe('150.5');
    });

    it('should use manual entry price when price list item is not available', async () => {
      const encounter = await createEncounter();
      const procedureType = await createProcedureType({
        name: 'Custom Procedure',
        code: 'CUSTOM-001',
      });
      const invoiceProduct = await createInvoiceProduct(procedureType);
      const invoice = await createInvoice(encounter.id, { displayId: 'INV-FINALISE-003' });
      const procedure = await createProcedure(encounter.id, procedureType.id);

      const manualPrice = 99.99;
      const invoiceItem = await createInvoiceItem(invoice.id, invoiceProduct.id, procedure.id, {
        manualEntryPrice: manualPrice,
      });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();

      const finalisedItem = await models.InvoiceItem.findByPk(invoiceItem.id);
      expect(finalisedItem.priceFinal).toBe('99.99');
    });

    it('should save insurance plan coverage values to InvoiceItemFinalisedInsurance', async () => {
      const encounter = await createEncounter();
      const insurancePlan1 = await createInsurancePlan('PLAN-001', 'Primary Insurance', 80);
      const insurancePlan2 = await createInsurancePlan('PLAN-002', 'Secondary Insurance', 50);

      const procedureType = await createProcedureType({
        name: 'Consultation',
        code: 'CONSULT-001',
      });
      const invoiceProduct = await createInvoiceProduct(procedureType);

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

      const invoice = await createInvoice(encounter.id, { displayId: 'INV-FINALISE-004' });
      await linkInsurancePlanToInvoice(invoice.id, insurancePlan1.id);
      await linkInsurancePlanToInvoice(invoice.id, insurancePlan2.id);

      const procedure = await createProcedure(encounter.id, procedureType.id);
      const invoiceItem = await createInvoiceItem(invoice.id, invoiceProduct.id, procedure.id);

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveSucceeded();

      const finalisedInsurances = await models.InvoiceItemFinalisedInsurance.findAll({
        where: { invoiceItemId: invoiceItem.id },
      });

      expect(finalisedInsurances).toHaveLength(2);

      const [secondary, primary] = finalisedInsurances.sort(
        (a, b) => a.coverageValueFinal - b.coverageValueFinal,
      );

      expect(secondary).toMatchObject({
        invoiceItemId: invoiceItem.id,
        invoiceInsurancePlanId: insurancePlan2.id,
        coverageValueFinal: '60',
      });

      expect(primary).toMatchObject({
        invoiceItemId: invoiceItem.id,
        invoiceInsurancePlanId: insurancePlan1.id,
        coverageValueFinal: '90',
      });
    });

    it('should return error when trying to finalise a non-existent invoice', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const result = await app.put(`/api/invoices/${nonExistentId}/finalise`);

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toBe('Invoice not found');
    });

    it.each([
      ['cancelled', INVOICE_STATUSES.CANCELLED],
      ['already finalised', INVOICE_STATUSES.FINALISED],
    ])('should return error when trying to finalise a %s invoice', async (description, status) => {
      const encounter = await createEncounter();
      const invoice = await createInvoice(encounter.id, { status });

      const result = await app.put(`/api/invoices/${invoice.id}/finalise`);

      expect(result).toHaveRequestError();
      expect(result.body.error.message).toContain('Only in progress invoices can be finalised');
    });
  });
});
