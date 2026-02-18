import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { INVOICE_INSURER_PAYMENT_STATUSES, INVOICE_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';

import { createTestContext } from '../utilities';

describe('Patient Payment Refund', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let user = null;
  let patient = null;
  let paymentMethod = null;
  let refundMethod = null;
  let insurer = null;

  const createEncounter = async () =>
    models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

  const createInvoice = async (encounterId, overrides = {}) =>
    models.Invoice.create({
      encounterId,
      displayId: overrides.displayId ?? `INV-${Date.now()}`,
      date: new Date(),
      status: INVOICE_STATUSES.IN_PROGRESS,
      ...overrides,
    });

  const createPatientPayment = async (invoiceId, methodId, overrides = {}) => {
    const payment = await models.InvoicePayment.create({
      invoiceId,
      date: '2024-01-15',
      receiptNumber: `REC-${Date.now()}`,
      amount: 100,
      updatedByUserId: user.id,
      ...overrides,
    });
    await models.InvoicePatientPayment.create({
      invoicePaymentId: payment.id,
      methodId,
    });
    return payment;
  };

  const createInsurerPayment = async (invoiceId, insurerId, overrides = {}) => {
    const payment = await models.InvoicePayment.create({
      invoiceId,
      date: '2024-01-15',
      receiptNumber: `REC-${Date.now()}`,
      amount: 100,
      updatedByUserId: user.id,
      ...overrides,
    });
    await models.InvoiceInsurerPayment.create({
      invoicePaymentId: payment.id,
      insurerId,
      status: INVOICE_INSURER_PAYMENT_STATUSES.PAID,
    });
    return payment;
  };

  const refundUrl = (invoiceId, paymentId) =>
    `/api/invoices/${invoiceId}/patientPayments/${paymentId}/refund`;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    paymentMethod = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: REFERENCE_TYPES.PAYMENT_METHOD,
        name: 'Cash',
        code: 'CASH',
      }),
    );
    refundMethod = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: REFERENCE_TYPES.PAYMENT_METHOD,
        name: 'Bank Transfer',
        code: 'BANK-TRANSFER',
      }),
    );
    insurer = await models.ReferenceData.create(
      fake(models.ReferenceData, {
        type: REFERENCE_TYPES.INSURER,
        name: 'Insurer',
        code: 'INSURER',
      }),
    );
    app = await baseApp.asUser(user);
  });

  beforeEach(async () => {
    const tablesToClean = ['Encounter', 'Invoice', 'InvoicePayment', 'InvoicePatientPayment'];
    await Promise.all(tablesToClean.map(table => models[table].truncate()));
  });

  afterAll(() => ctx.close());

  it('should successfully refund a patient payment', async () => {
    const encounter = await createEncounter();
    const invoice = await createInvoice(encounter.id);
    const payment = await createPatientPayment(invoice.id, paymentMethod.id);

    const result = await app
      .post(refundUrl(invoice.id, payment.id))
      .send({ methodId: refundMethod.id });

    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      invoiceId: invoice.id,
      originalPaymentId: payment.id,
      amount: payment.amount,
      receiptNumber: payment.receiptNumber,
    });

    // Verify the refund's InvoicePatientPayment was created with the correct method
    const refundPatientPayment = await models.InvoicePatientPayment.findOne({
      where: { invoicePaymentId: result.body.id },
    });
    expect(refundPatientPayment).toBeTruthy();
    expect(refundPatientPayment.methodId).toBe(refundMethod.id);
  });


  it('should reject refunding a payment that is not a patient payment', async () => {
    const encounter = await createEncounter();
    const invoice = await createInvoice(encounter.id);
    const insurerPayment = await createInsurerPayment(invoice.id, insurer.id);

    const result = await app.post(refundUrl(invoice.id, insurerPayment.id)).send({ methodId: refundMethod.id });
    expect(result).toBeForbidden();
    expect(result.body.error.message).toBe('Payment is not a patient payment');
  });
  
  it('should reject refund without methodId', async () => {
    const encounter = await createEncounter();
    const invoice = await createInvoice(encounter.id);
    const payment = await createPatientPayment(invoice.id, paymentMethod.id);

    const result = await app.post(refundUrl(invoice.id, payment.id)).send({});

    expect(result).toHaveRequestError();
  });

  it('should return 404 for non-existent invoice', async () => {
    const fakeInvoiceId = '00000000-0000-0000-0000-000000000000';
    const fakePaymentId = '00000000-0000-0000-0000-000000000001';

    const result = await app
      .post(refundUrl(fakeInvoiceId, fakePaymentId))
      .send({ methodId: refundMethod.id });

    expect(result).toHaveRequestError();
  });

  it('should return 404 for non-existent payment', async () => {
    const encounter = await createEncounter();
    const invoice = await createInvoice(encounter.id);
    const fakePaymentId = '00000000-0000-0000-0000-000000000001';

    const result = await app
      .post(refundUrl(invoice.id, fakePaymentId))
      .send({ methodId: refundMethod.id });

    expect(result).toHaveRequestError();
    expect(result.body.error.message).toBe('Payment not found');
  });

  it('should reject refunding an already-refunded payment', async () => {
    const encounter = await createEncounter();
    const invoice = await createInvoice(encounter.id);
    const payment = await createPatientPayment(invoice.id, paymentMethod.id);

    // First refund should succeed
    const firstRefund = await app
      .post(refundUrl(invoice.id, payment.id))
      .send({ methodId: refundMethod.id });
    expect(firstRefund).toHaveSucceeded();

    // Second refund of the same payment should fail
    const secondRefund = await app
      .post(refundUrl(invoice.id, payment.id))
      .send({ methodId: refundMethod.id });
    expect(secondRefund).toBeForbidden();
    expect(secondRefund.body.error.message).toBe('Payment has already been refunded');
  });

  it('should reject refunding a refund payment', async () => {
    const encounter = await createEncounter();
    const invoice = await createInvoice(encounter.id);
    const payment = await createPatientPayment(invoice.id, paymentMethod.id);

    // Create the refund
    const refundResult = await app
      .post(refundUrl(invoice.id, payment.id))
      .send({ methodId: refundMethod.id });
    expect(refundResult).toHaveSucceeded();

    // Try to refund the refund
    const refundOfRefund = await app
      .post(refundUrl(invoice.id, refundResult.body.id))
      .send({ methodId: refundMethod.id });
    expect(refundOfRefund).toBeForbidden();
    expect(refundOfRefund.body.error.message).toBe('This payment is a refund of another payment');
  });
});
