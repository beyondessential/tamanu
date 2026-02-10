import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import express from 'express';
import Decimal from 'decimal.js';

import { ForbiddenError, NotFoundError, ValidationError } from '@tamanu/errors';
import {
  getInvoicePatientPaymentStatus,
  round,
  getInvoiceSummary,
} from '@tamanu/shared/utils/invoice';
import { getCurrentDateString } from '@tamanu/utils/dateTime';

const createPatientPaymentSchema = z
  .object({
    date: z.string().date(),
    amount: z.coerce.number().transform(amount => round(amount, 2)),
    receiptNumber: z.string().regex(/^[A-Za-z0-9]+$/),
    methodId: z.string(),
    chequeNumber: z.string().optional(),
  })
  .strip();

const updatePatientPaymentSchema = z
  .object({
    date: z.string().date(),
    amount: z.coerce.number().transform(amount => round(amount, 2)),
    receiptNumber: z.string().regex(/^[A-Za-z0-9]+$/),
    methodId: z.string(),
    chequeNumber: z.string().optional(),
  })
  .strip();

const refundPatientPaymentSchema = z
  .object({
    methodId: z.string(),
  })
  .strip();

async function getInvoiceWithDetails(req, encounterId) {
  const invoicePriceListId =
    await req.models.InvoicePriceList.getIdForPatientEncounter(encounterId);
  return await req.models.Invoice.findOne({
    where: { encounterId },
    include: req.models.Invoice.getFullReferenceAssociations(invoicePriceListId),
  });
}

const validateInvoiceExists = async (req, invoiceId) => {
  const invoice = await req.models.Invoice.findByPk(invoiceId, {
    attributes: ['id', 'encounterId'],
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }
  if (!invoice.encounterId) {
    throw new NotFoundError('Invoice encounter not found');
  }

  return invoice;
};

async function getEncounterIdFromInvoiceId(req, invoiceId) {
  const invoice = await validateInvoiceExists(req, invoiceId);
  return invoice.encounterId;
}

const handleCreatePatientPayment = asyncHandler(async (req, res) => {
  req.checkPermission('create', 'InvoicePayment');
  const { invoiceId } = req.params;

  const encounterId = await getEncounterIdFromInvoiceId(req, invoiceId);
  const invoice = await getInvoiceWithDetails(req, encounterId);

  if (!invoice) throw new NotFoundError('Invoice not found');

  const { data, error } = await createPatientPaymentSchema.safeParseAsync(req.body);
  if (error) throw new ValidationError(error.message);

  const { patientTotal, patientPaymentRemainingBalance } = getInvoiceSummary(invoice);

  if (data.amount > round(patientPaymentRemainingBalance, 2)) {
    throw new ForbiddenError('Amount of payment is higher than the owing total');
  }

  const transaction = await req.db.transaction();

  try {
    const payment = await req.models.InvoicePayment.create(
      {
        invoiceId,
        date: data.date,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
        updatedByUserId: req.user.id ?? null,
      },
      { returning: true, transaction },
    );
    await req.models.InvoicePatientPayment.create(
      {
        invoicePaymentId: payment.id,
        methodId: data.methodId,
        chequeNumber: data.chequeNumber,
      },
      { transaction },
    );

    //Update the overall patient payment status to invoice
    await req.models.Invoice.update(
      {
        patientPaymentStatus: getInvoicePatientPaymentStatus(
          new Decimal(patientTotal)
            .minus(patientPaymentRemainingBalance)
            .add(data.amount)
            .toNumber(),
          patientTotal,
        ),
      },
      { where: { id: invoiceId } },
      { transaction },
    );
    await transaction.commit();
    res.json(payment);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

const handleUpdatePatientPayment = asyncHandler(async (req, res) => {
  req.checkPermission('write', 'InvoicePayment');
  const invoiceId = req.params.invoiceId;
  const paymentId = req.params.paymentId;

  const encounterId = await getEncounterIdFromInvoiceId(req, invoiceId);
  const invoice = await getInvoiceWithDetails(req, encounterId);

  const payment = await req.models.InvoicePayment.findByPk(paymentId);

  if (!invoice) throw new NotFoundError('Invoice not found');

  if (!payment) throw new NotFoundError('Payment not found');

  const { data, error } = await updatePatientPaymentSchema.safeParseAsync(req.body);
  if (error) throw new ValidationError(error.message);

  const { patientTotal, patientPaymentRemainingBalance } = getInvoiceSummary(invoice);
  if (
    data.amount >
    round(new Decimal(patientPaymentRemainingBalance).add(payment.amount).toNumber(), 2)
  )
    throw new ForbiddenError('Amount of payment is higher than the invoice total');

  const transaction = await req.db.transaction();

  try {
    await req.models.InvoicePayment.update(
      {
        date: data.date,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
        updatedByUserId: req.user.id ?? null,
      },
      { where: { id: paymentId } },
      { transaction, returning: true },
    );
    await req.models.InvoicePatientPayment.update(
      {
        methodId: data.methodId,
        chequeNumber: data.chequeNumber,
      },
      { where: { invoicePaymentId: paymentId } },
      { transaction },
    );

    //Update the overall patient payment status to invoice
    await req.models.Invoice.update(
      {
        patientPaymentStatus: getInvoicePatientPaymentStatus(
          new Decimal(patientTotal)
            .minus(patientPaymentRemainingBalance)
            .minus(payment.amount)
            .add(data.amount)
            .toNumber(),
          patientTotal,
        ),
      },
      { where: { id: invoiceId } },
      { transaction },
    );
    await transaction.commit();
    res.json(payment);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

const handleGetPatientPayments = asyncHandler(async (req, res) => {
  req.checkPermission('list', 'InvoicePayment');

  const invoiceId = req.params.invoiceId;

  const patientPayments = await req.models.InvoicePatientPayment.findAll({
    include: [
      {
        model: req.models.InvoicePayment,
        as: 'detail',
        where: { invoiceId },
        include: [{ model: req.models.User, as: 'updatedByUser' }],
      },
      { model: req.models.ReferenceData, as: 'method' },
      { model: req.models.InvoicePayment, as: 'refundPayment' },
    ],
    where: {
      '$detail.originalPaymentId$': null,
    },
  }).then(payments =>
    payments.map(payment => ({
      id: payment.invoicePaymentId,
      date: payment.detail.date,
      amount: payment.detail.amount,
      receiptNumber: payment.detail.receiptNumber,
      methodId: payment.methodId,
      methodName: payment.method.name,
    })),
  );

  res.json({ count: patientPayments.length, data: patientPayments });
});

const handleRefundPatientPayment = asyncHandler(async (req, res) => {
  req.checkPermission('write', 'InvoicePayment');
  const { invoiceId, paymentId } = req.params;

  await validateInvoiceExists(req, invoiceId);

  const payment = await req.models.InvoicePayment.findByPk(paymentId, {
    include: [
      { model: req.models.InvoicePatientPayment, as: 'patientPayment' },
      { model: req.models.InvoicePayment, as: 'refundPayment' },
      { model: req.models.InvoicePayment, as: 'originalPayment' },
    ],
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }
  if (!payment.patientPayment) {
    throw new ForbiddenError('Payment is not a patient payment');
  }
  if (payment.refundPayment) {
    throw new ForbiddenError('Payment has already been refunded');
  }
  if (payment.originalPayment) {
    throw new ForbiddenError('This payment is a refund of another payment');
  }

  const { data, error } = await refundPatientPaymentSchema.safeParseAsync(req.body);
  if (error) {
    throw new ValidationError(error.message);
  }

  const transaction = await req.db.transaction();

  try {
    const refundPayment = await req.models.InvoicePayment.create(
      {
        invoiceId,
        date: getCurrentDateString(),
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        updatedByUserId: req.user.id ?? null,
        originalPaymentId: paymentId,
      },
      { returning: true, transaction },
    );
    await req.models.InvoicePatientPayment.create(
      {
        invoicePaymentId: refundPayment.id,
        methodId: data.methodId,
      },
      { transaction },
    );

    await transaction.commit();
    res.json(refundPayment);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const patientPaymentRoute = express.Router();

patientPaymentRoute.post('/:invoiceId/patientPayments', handleCreatePatientPayment);
patientPaymentRoute.put('/:invoiceId/patientPayments/:paymentId', handleUpdatePatientPayment);
patientPaymentRoute.get('/:invoiceId/patientPayments', handleGetPatientPayments);
patientPaymentRoute.post(
  '/:invoiceId/patientPayments/:paymentId/refund',
  handleRefundPatientPayment,
);
