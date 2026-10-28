import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { INVOICE_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';
import { generateReceiptNumber } from '@tamanu/utils/invoice';

import { createTestContext } from '../utilities';

// Routes that load invoices to price them must load items against the encounter's price list,
// otherwise items have no price and silently price at zero
describe('Invoice pricing routes', () => {
  let ctx;
  let models;
  let app;
  let user;
  let patient;
  let product;
  let paymentMethod;

  const createInvoice = async (overrides = {}) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    return models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${Date.now()}-${Math.random()}`,
      date: new Date(),
      status: INVOICE_STATUSES.IN_PROGRESS,
      ...overrides,
    });
  };

  const createItem = (invoiceId, overrides = {}) =>
    models.InvoiceItem.create(
      fake(models.InvoiceItem, {
        invoiceId,
        productId: product.id,
        quantity: 2,
        priceFinal: null,
        isFixedPriceFinal: false,
        orderedByUserId: user.id,
        ...overrides,
      }),
    );

  const createPatientPayment = async (invoiceId, amount) => {
    const payment = await models.InvoicePayment.create({
      invoiceId,
      date: '2024-01-15',
      receiptNumber: generateReceiptNumber(),
      amount,
      updatedByUserId: user.id,
    });
    await models.InvoicePatientPayment.create({
      invoicePaymentId: payment.id,
      methodId: paymentMethod.id,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    paymentMethod = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.PAYMENT_METHOD, code: 'PRICING-CASH' }),
    );
    product = await models.InvoiceProduct.create(fake(models.InvoiceProduct, { insurable: false }));
    // Sorts ahead of any other price list in the test database, so it is the one that applies
    const priceList = await models.InvoicePriceList.create(
      fake(models.InvoicePriceList, { code: 'PRICING-ROUTES', rules: {}, evaluationOrder: -1000 }),
    );
    await models.InvoicePriceListItem.create({
      invoicePriceListId: priceList.id,
      invoiceProductId: product.id,
      price: 12.5,
    });
    app = await ctx.baseApp.asUser(user);
  });

  beforeEach(async () => {
    const tablesToClean = ['Invoice', 'InvoiceItem', 'InvoicePayment', 'InvoicePatientPayment'];
    await Promise.all(tablesToClean.map(table => models[table].truncate({ cascade: true })));
  });

  afterAll(() => ctx.close());

  describe('GET /api/invoices/:id/items', () => {
    it('returns items priced against the price list', async () => {
      const invoice = await createInvoice();
      await createItem(invoice.id);

      const result = await app.get(`/api/invoices/${invoice.id}/items`);

      expect(result).toHaveSucceeded();
      expect(result.body.data).toHaveLength(1);
      expect(Number(result.body.data[0].product.invoicePriceListItem.price)).toBe(12.5);
    });

    it('returns not found for an unknown invoice', async () => {
      const result = await app.get(`/api/invoices/${crypto.randomUUID()}/items`);

      expect(result).toHaveStatus(404);
    });
  });

  describe('GET /api/patient/:id/invoices', () => {
    it("returns the patient's invoices with their items priced", async () => {
      const invoice = await createInvoice();
      await createItem(invoice.id);

      const result = await app.get(`/api/patient/${patient.id}/invoices`);

      expect(result).toHaveSucceeded();
      expect(result.body.count).toBe(1);
      expect(Number(result.body.data[0].items[0].product.invoicePriceListItem.price)).toBe(12.5);
    });

    it('is forbidden without permission to list invoices', async () => {
      const baseApp = await ctx.baseApp.asRole('base');

      const result = await baseApp.get(`/api/patient/${patient.id}/invoices`);

      expect(result).toBeForbidden();
    });
  });

  describe('GET /api/patient/:id/invoices/totalOutstandingBalance', () => {
    it('sums what is still owed on finalised invoices only', async () => {
      const finalisedInvoice = await createInvoice({ status: INVOICE_STATUSES.FINALISED });
      await createItem(finalisedInvoice.id, { priceFinal: 50 });
      await createPatientPayment(finalisedInvoice.id, 30);
      // Priced from the price list at 2 × 12.5, but still in progress so not yet owed
      const inProgressInvoice = await createInvoice();
      await createItem(inProgressInvoice.id);

      const result = await app.get(`/api/patient/${patient.id}/invoices/totalOutstandingBalance`);

      expect(result).toHaveSucceeded();
      // 2 × 50 = 100, less 30 paid
      expect(result.body.result).toBe(70);
    });

    it('is zero when the patient has no finalised invoices', async () => {
      const result = await app.get(`/api/patient/${patient.id}/invoices/totalOutstandingBalance`);

      expect(result).toHaveSucceeded();
      expect(result.body.result).toBe(0);
    });
  });
});
