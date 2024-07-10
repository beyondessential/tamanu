import asyncHandler from 'express-async-handler';
import express from 'express';

export const insurerPaymentRoute = express.Router();

insurerPaymentRoute.get(
  '/:invoiceId/insurerPayments',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'InvoicePayment');

    const invoiceId = req.params.invoiceId;
    const insurerPayments = await req.models.InvoiceInsurerPayment.findAll({
      include: [
        { model: req.models.InvoicePayment, as: 'detail', where: { invoiceId } },
        { model: req.models.ReferenceData, as: 'insurer' },
      ],
    }).then(payments =>
      payments.map(payment => ({
        id: payment.invoicePaymentId,
        date: payment.detail.date,
        amount: payment.detail.amount,
        receiptNumber: payment.detail.receiptNumber,
        insurerName: payment.insurer.name,
        status: payment.status,
      })),
    );

    res.json({ count: insurerPayments.length, data: insurerPayments });
  }),
);
