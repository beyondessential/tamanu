import asyncHandler from 'express-async-handler';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { z } from 'zod';
import { ForbiddenError, NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import express from 'express';

const createPatientPaymentSchema = z
  .object({
    date: z.string().date(),
    amount: z.number(),
    receiptNumber: z.string().regex(/^[A-Z0-9]+$/),
    method: z.string(),
  })
  .strip();

const updatePatientPaymentSchema = z
  .object({
    date: z.string().date(),
    amount: z.number(),
    receiptNumber: z.string().regex(/^[A-Z0-9]+$/),
    method: z.string(),
  })
  .strip();

async function getInvoiceWithDetails(req, invoiceId) {
  return req.models.Invoice.findByPk(invoiceId, {
    include: [
      {
        model: req.models.InvoiceItem,
        as: 'items',
        include: [
          { model: req.models.Product, as: 'product' },
          { model: req.models.InvoiceItemDiscount, as: 'discount' },
        ],
      },
      { model: req.models.InvoiceDiscount, as: 'discount' },
      { model: req.models.InvoiceInsurer, as: 'insurers' },
      {
        model: req.models.InvoicePayment,
        as: 'payments',
        include: [{ model: req.models.InvoicePatientPayment, as: 'patientPayment' }],
      },
    ],
  });
}
const handleCreatePatientPayment = asyncHandler(async (req, res) => {
  req.checkPermission('write', 'Invoice');

  const invoiceId = req.params.id;

  const invoice = await getInvoiceWithDetails(req, invoiceId);

  if (!invoice) throw new NotFoundError('Invoice not found');
  if (invoice.status !== INVOICE_STATUSES.FINALISED)
    throw new ForbiddenError('Invoice is not finalised');

  const { data, error } = await createPatientPaymentSchema.safeParseAsync(req.body);
  if (error) throw new ValidationError(error.message);

  const { patientTotal, patientPaymentsTotal } = getInvoiceSummary(invoice);
  if (data.amount > patientTotal - patientPaymentsTotal)
    throw new ForbiddenError('Amount of payment is higher than the invoice total');

  const transaction = await req.db.transaction();

  try {
    const payment = await req.models.InvoicePayment.create(
      {
        invoiceId,
        date: data.date,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
      },
      { returning: true, transaction },
    );
    await req.models.InvoicePatientPayment.create(
      {
        id: payment.id,
        method: data.method,
      },
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
  req.checkPermission('write', 'Invoice');

  const invoiceId = req.params.invoiceId;
  const paymentId = req.params.paymentId;

  const invoice = await getInvoiceWithDetails(req, invoiceId);
  const payment = await req.models.InvoicePayment.findByPk(paymentId);

  if (!invoice) throw new NotFoundError('Invoice not found');
  if (invoice.status !== INVOICE_STATUSES.FINALISED)
    throw new ForbiddenError('Invoice is not finalised');
  if (!payment) throw new NotFoundError('Payment not found');

  const { data, error } = await updatePatientPaymentSchema.safeParseAsync(req.body);
  if (error) throw new ValidationError(error.message);

  const { patientTotal, patientPaymentsTotal } = getInvoiceSummary(invoice);
  if (data.amount > patientTotal - patientPaymentsTotal + payment.amount)
    throw new ForbiddenError('Amount of payment is higher than the invoice total');

  const transaction = await req.db.transaction();

  try {
    await req.models.InvoicePayment.update(
      {
        date: data.date,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
      },
      { where: { id: paymentId } },
      { transaction, returning: true },
    );
    await req.models.InvoicePatientPayment.update(
      {
        method: data.method,
      },
      { where: { id: paymentId } },
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
  req.checkPermission('read', 'Invoice');

  const invoiceId = req.params.id;
  const patientPayments = await req.models.InvoicePatientPayment.findAll({
    include: [{ model: req.models.InvoicePayment, as: 'detail', where: { invoiceId } }],
  }).then(payments =>
    payments.map(payment => ({
      id: payment.id,
      date: payment.detail.date,
      amount: payment.detail.amount,
      receiptNumber: payment.detail.receiptNumber,
      method: payment.method,
    })),
  );

  res.json(patientPayments);
});

export const patientPaymentRoute = express.Router();

patientPaymentRoute.post('/:id/patientPayments', handleCreatePatientPayment);
patientPaymentRoute.put('/:invoiceId/patientPayments/:paymentId', handleUpdatePatientPayment);
patientPaymentRoute.get('/:id/patientPayments', handleGetPatientPayments);
