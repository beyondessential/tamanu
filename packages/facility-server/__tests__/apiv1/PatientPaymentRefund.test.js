import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import {
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { generateReceiptNumber } from '@tamanu/utils/invoice';

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
      receiptNumber: generateReceiptNumber(),
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

  const createInsurerPayment = async (invoiceId, invoiceInsurancePlanId, overrides = {}) => {
    const payment = await models.InvoicePayment.create({
      invoiceId,
      date: '2024-01-15',
      receiptNumber: generateReceiptNumber(),
      amount: 100,
      updatedByUserId: user.id,
      ...overrides,
    });
    await models.InvoiceInsurancePlanPayment.create({
      invoicePaymentId: payment.id,
      invoiceInsurancePlanId,
      status: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.PAID,
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
    insurer = await models.InvoiceInsurancePlan.create(
      fake(models.InvoiceInsurancePlan, {
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

    const result = await app
      .post(refundUrl(invoice.id, insurerPayment.id))
      .send({ methodId: refundMethod.id });
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

  describe('patientPaymentStatus update', () => {
    const createPaymentUrl = invoiceId => `/api/invoices/${invoiceId}/patientPayments`;

    const createInvoiceWithItem = async (encounterId, itemPrice) => {
      const invoice = await createInvoice(encounterId, {
        status: INVOICE_STATUSES.FINALISED,
      });
      await models.InvoiceItem.create(
        fake(models.InvoiceItem, {
          invoiceId: invoice.id,
          quantity: 1,
          priceFinal: itemPrice,
          orderedByUserId: user.id,
        }),
      );
      return invoice;
    };

    // An invoice whose attached plan covers each insurable item at coveragePercentage, either
    // through the product's own plan item or, with coverVia 'planDefault', through the plan's
    // default coverage for a product that has no plan item of its own
    const createInsuredInvoice = async (
      encounterId,
      {
        itemPrices,
        coveragePercentage,
        coverVia = 'planItem',
        status = INVOICE_STATUSES.FINALISED,
      },
    ) => {
      const invoice = await createInvoice(encounterId, { status });
      const coversByDefault = coverVia === 'planDefault';
      const plan = await models.InvoiceInsurancePlan.create(
        fake(models.InvoiceInsurancePlan, {
          defaultCoverage: coversByDefault ? coveragePercentage : 0,
        }),
      );
      await models.InvoicesInvoiceInsurancePlan.create({
        invoiceId: invoice.id,
        invoiceInsurancePlanId: plan.id,
      });

      const addInsuredItem = async itemPrice => {
        const product = await models.InvoiceProduct.create(
          fake(models.InvoiceProduct, { insurable: true }),
        );
        if (!coversByDefault) {
          await models.InvoiceInsurancePlanItem.create({
            invoiceInsurancePlanId: plan.id,
            invoiceProductId: product.id,
            coverageValue: coveragePercentage,
          });
        }
        return models.InvoiceItem.create(
          fake(models.InvoiceItem, {
            invoiceId: invoice.id,
            productId: product.id,
            quantity: 1,
            priceFinal: itemPrice,
            orderedByUserId: user.id,
          }),
        );
      };

      const items = [];
      for (const itemPrice of itemPrices) {
        items.push(await addInsuredItem(itemPrice));
      }

      return { invoice, items };
    };

    const createPaymentViaApi = async (invoiceId, amount) => {
      const result = await app.post(createPaymentUrl(invoiceId)).send({
        date: '2024-01-15',
        amount,
        receiptNumber: generateReceiptNumber(),
        methodId: paymentMethod.id,
      });
      expect(result).toHaveSucceeded();
      return result.body;
    };

    const getInvoiceStatus = async invoiceId => {
      const invoice = await models.Invoice.findByPk(invoiceId);
      return invoice.patientPaymentStatus;
    };

    it('should set status to unpaid when fully paid invoice is fully refunded', async () => {
      const encounter = await createEncounter();
      const invoice = await createInvoiceWithItem(encounter.id, 100);

      const payment = await createPaymentViaApi(invoice.id, 100);
      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);

      const refund = await app
        .post(refundUrl(invoice.id, payment.id))
        .send({ methodId: refundMethod.id });
      expect(refund).toHaveSucceeded();

      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID);
    });

    it('should set status to partial when one of two payments is refunded', async () => {
      const encounter = await createEncounter();
      const invoice = await createInvoiceWithItem(encounter.id, 200);

      const payment1 = await createPaymentViaApi(invoice.id, 100);
      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL);

      await createPaymentViaApi(invoice.id, 100);
      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);

      const refund = await app
        .post(refundUrl(invoice.id, payment1.id))
        .send({ methodId: refundMethod.id });
      expect(refund).toHaveSucceeded();

      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL);
    });

    it('should set status to unpaid when partial payment is refunded', async () => {
      const encounter = await createEncounter();
      const invoice = await createInvoiceWithItem(encounter.id, 200);

      const payment = await createPaymentViaApi(invoice.id, 100);
      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL);

      const refund = await app
        .post(refundUrl(invoice.id, payment.id))
        .send({ methodId: refundMethod.id });
      expect(refund).toHaveSucceeded();

      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID);
    });

    it('should set status to paid when the patient pays their share of an insured invoice', async () => {
      const encounter = await createEncounter();
      const { invoice } = await createInsuredInvoice(encounter.id, {
        itemPrices: [225],
        coveragePercentage: 50,
      });

      await createPaymentViaApi(invoice.id, 112.5);

      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
    });

    it('should reject a payment above the patient share of an insured invoice', async () => {
      const encounter = await createEncounter();
      const { invoice } = await createInsuredInvoice(encounter.id, {
        itemPrices: [225],
        coveragePercentage: 50,
      });

      const result = await app.post(createPaymentUrl(invoice.id)).send({
        date: '2024-01-15',
        amount: 112.51,
        receiptNumber: generateReceiptNumber(),
        methodId: paymentMethod.id,
      });

      expect(result).toBeForbidden();
    });

    it('should set status to unpaid when the patient share of an insured invoice is refunded', async () => {
      const encounter = await createEncounter();
      const { invoice } = await createInsuredInvoice(encounter.id, {
        itemPrices: [225],
        coveragePercentage: 50,
      });

      const payment = await createPaymentViaApi(invoice.id, 112.5);
      const refund = await app
        .post(refundUrl(invoice.id, payment.id))
        .send({ methodId: refundMethod.id });
      expect(refund).toHaveSucceeded();

      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID);
    });

    it('should count coverage the plan provides through its default coverage', async () => {
      const encounter = await createEncounter();
      const { invoice } = await createInsuredInvoice(encounter.id, {
        itemPrices: [225],
        coveragePercentage: 50,
        coverVia: 'planDefault',
      });

      const overpayment = await app.post(createPaymentUrl(invoice.id)).send({
        date: '2024-01-15',
        amount: 112.51,
        receiptNumber: generateReceiptNumber(),
        methodId: paymentMethod.id,
      });
      expect(overpayment).toBeForbidden();

      await createPaymentViaApi(invoice.id, 112.5);

      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
    });

    it('should recalculate status against the patient share when the items are updated', async () => {
      const encounter = await createEncounter();
      const { invoice, items } = await createInsuredInvoice(encounter.id, {
        itemPrices: [225, 225],
        coveragePercentage: 50,
        status: INVOICE_STATUSES.IN_PROGRESS,
      });

      // The patient owes half of the $450 of items, so this covers half of their share
      await createPaymentViaApi(invoice.id, 112.5);
      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PARTIAL);

      // Dropping one item halves what the patient owes, which the payment then covers in full
      const [keptItem] = items;
      const result = await app.put(`/api/invoices/${invoice.id}`).send({
        items: [
          {
            id: keptItem.id,
            orderDate: keptItem.orderDate,
            orderedByUserId: user.id,
            productId: keptItem.productId,
            quantity: 1,
          },
        ],
      });
      expect(result).toHaveSucceeded();

      expect(await getInvoiceStatus(invoice.id)).toBe(INVOICE_PATIENT_PAYMENT_STATUSES.PAID);
    });
  });
});
