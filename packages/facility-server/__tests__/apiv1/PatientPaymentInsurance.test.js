import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { generateReceiptNumber } from '@tamanu/utils/invoice';

import { createTestContext } from '../utilities';

// Patient payments are checked against what the patient owes after insurance, the same figure the
// web invoice summary shows (TAM-7212)
describe('Patient payments on an insured invoice', () => {
  let ctx;
  let models;
  let app;
  let user;
  let patient;
  let paymentMethod;
  let insurancePlan;
  let insurableProduct;

  // The plan defaults to 60% but covers this product at 75%, so the patient owes 25 of 100
  const PATIENT_SHARE = 25;

  const paymentsUrl = invoiceId => `/api/invoices/${invoiceId}/patientPayments`;

  // An invoice for one insurable item priced at 100, with the insurance plan attached
  const createInsuredInvoice = async (status = INVOICE_STATUSES.FINALISED) => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${Date.now()}`,
      date: new Date(),
      status,
    });
    await models.InvoicesInvoiceInsurancePlan.create({
      invoiceId: invoice.id,
      invoiceInsurancePlanId: insurancePlan.id,
    });
    const item = await models.InvoiceItem.create(
      fake(models.InvoiceItem, {
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        productId: insurableProduct.id,
        quantity: 1,
        ...(status === INVOICE_STATUSES.FINALISED
          ? { priceFinal: 100 }
          : { priceFinal: null, manualEntryPrice: 100 }),
        orderedByUserId: user.id,
      }),
    );
    return { invoice, item };
  };

  const payFromPatient = (invoiceId, amount) =>
    app.post(paymentsUrl(invoiceId)).send({
      date: '2024-01-15',
      amount,
      receiptNumber: generateReceiptNumber(),
      methodId: paymentMethod.id,
    });

  // A payment recorded directly, as one taken before payments were checked after insurance
  const recordLegacyPayment = async (invoiceId, amount) => {
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
    return payment;
  };

  const getPatientPaymentStatus = async invoiceId =>
    (await models.Invoice.findByPk(invoiceId)).patientPaymentStatus;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    paymentMethod = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.PAYMENT_METHOD, code: 'CASH' }),
    );
    insurancePlan = await models.InvoiceInsurancePlan.create(
      fake(models.InvoiceInsurancePlan, { code: 'PLAN-60', defaultCoverage: 60 }),
    );
    insurableProduct = await models.InvoiceProduct.create(
      fake(models.InvoiceProduct, { insurable: true }),
    );
    await models.InvoiceInsurancePlanItem.create({
      invoiceInsurancePlanId: insurancePlan.id,
      invoiceProductId: insurableProduct.id,
      coverageValue: 75,
    });
    app = await ctx.baseApp.asUser(user);
  });

  beforeEach(async () => {
    const tablesToClean = ['Encounter', 'Invoice', 'InvoicePayment', 'InvoicePatientPayment'];
    await Promise.all(tablesToClean.map(table => models[table].truncate({ cascade: true })));
  });

  afterAll(() => ctx.close());

  describe('recording a payment', () => {
    it('refuses a payment above the amount owed after insurance', async () => {
      const { invoice } = await createInsuredInvoice();

      const result = await payFromPatient(invoice.id, PATIENT_SHARE + 0.01);

      expect(result).toBeForbidden();
    });

    it('marks the invoice paid once the patient has paid their share', async () => {
      const { invoice } = await createInsuredInvoice();

      const result = await payFromPatient(invoice.id, PATIENT_SHARE);

      expect(result).toHaveSucceeded();
      expect(await getPatientPaymentStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
    });
  });

  it('refuses a payment once earlier payments cover more than is now owed', async () => {
    const { invoice } = await createInsuredInvoice();
    await recordLegacyPayment(invoice.id, 60);

    const result = await payFromPatient(invoice.id, 0);

    expect(result).toBeForbidden();
  });

  describe('updating a payment', () => {
    it('refuses an update above the amount owed after insurance', async () => {
      const { invoice } = await createInsuredInvoice();
      const payment = await payFromPatient(invoice.id, 10);

      const result = await app.put(`${paymentsUrl(invoice.id)}/${payment.body.id}`).send({
        date: '2024-01-15',
        amount: PATIENT_SHARE + 0.01,
        receiptNumber: payment.body.receiptNumber,
        methodId: paymentMethod.id,
      });

      expect(result).toBeForbidden();
    });

    it('marks the invoice paid when an update covers the patient share', async () => {
      const { invoice } = await createInsuredInvoice();
      const payment = await payFromPatient(invoice.id, 10);

      const result = await app.put(`${paymentsUrl(invoice.id)}/${payment.body.id}`).send({
        date: '2024-01-15',
        amount: PATIENT_SHARE,
        receiptNumber: payment.body.receiptNumber,
        methodId: paymentMethod.id,
      });

      expect(result).toHaveSucceeded();
      expect(await getPatientPaymentStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
    });
  });

  describe('refunding a payment', () => {
    it('marks the invoice unpaid when the patient share is refunded', async () => {
      const { invoice } = await createInsuredInvoice();
      const payment = await payFromPatient(invoice.id, PATIENT_SHARE);

      const result = await app
        .post(`${paymentsUrl(invoice.id)}/${payment.body.id}/refund`)
        .send({ methodId: paymentMethod.id });

      expect(result).toHaveSucceeded();
      expect(await getPatientPaymentStatus(invoice.id)).toBe(
        INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID,
      );
    });

    it('refunds when earlier payments exceed what is now owed after insurance', async () => {
      const { invoice } = await createInsuredInvoice();
      await recordLegacyPayment(invoice.id, 60);
      const refundedPayment = await recordLegacyPayment(invoice.id, 40);

      const result = await app
        .post(`${paymentsUrl(invoice.id)}/${refundedPayment.id}/refund`)
        .send({ methodId: paymentMethod.id });

      expect(result).toHaveSucceeded();
      expect(await getPatientPaymentStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
    });
  });

  describe('updating the invoice', () => {
    it('keeps the invoice paid when the patient has paid their share', async () => {
      const { invoice, item } = await createInsuredInvoice(INVOICE_STATUSES.IN_PROGRESS);
      await payFromPatient(invoice.id, PATIENT_SHARE);

      const result = await app.put(`/api/invoices/${invoice.id}`).send({
        items: [
          {
            id: item.id,
            orderDate: '2024-01-15',
            orderedByUserId: user.id,
            productId: insurableProduct.id,
            manualEntryPrice: 100,
            quantity: 1,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      expect(await getPatientPaymentStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
    });
  });
});
