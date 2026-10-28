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

  const createPaymentUrl = invoiceId => `/api/invoices/${invoiceId}/patientPayments`;

  // A finalised invoice for one insurable item priced at 100, covered 60% by the insurance plan
  const createInsuredInvoice = async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const invoice = await models.Invoice.create({
      encounterId: encounter.id,
      displayId: `INV-${Date.now()}`,
      date: new Date(),
      status: INVOICE_STATUSES.FINALISED,
    });
    await models.InvoicesInvoiceInsurancePlan.create({
      invoiceId: invoice.id,
      invoiceInsurancePlanId: insurancePlan.id,
    });
    await models.InvoiceItem.create(
      fake(models.InvoiceItem, {
        invoiceId: invoice.id,
        productId: insurableProduct.id,
        quantity: 1,
        priceFinal: 100,
        orderedByUserId: user.id,
      }),
    );
    return invoice;
  };

  const payFromPatient = (invoiceId, amount) =>
    app.post(createPaymentUrl(invoiceId)).send({
      date: '2024-01-15',
      amount,
      receiptNumber: generateReceiptNumber(),
      methodId: paymentMethod.id,
    });

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
    app = await ctx.baseApp.asUser(user);
  });

  beforeEach(async () => {
    const tablesToClean = ['Encounter', 'Invoice', 'InvoicePayment', 'InvoicePatientPayment'];
    await Promise.all(tablesToClean.map(table => models[table].truncate({ cascade: true })));
  });

  afterAll(() => ctx.close());

  it('refuses a payment above the amount owed after insurance', async () => {
    const invoice = await createInsuredInvoice();

    const result = await payFromPatient(invoice.id, 100);

    expect(result).toBeForbidden();
  });

  it('marks the invoice paid once the patient has paid their share', async () => {
    const invoice = await createInsuredInvoice();

    const result = await payFromPatient(invoice.id, 40);

    expect(result).toHaveSucceeded();
    const { patientPaymentStatus } = await models.Invoice.findByPk(invoice.id);
    expect(patientPaymentStatus).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
  });
});
