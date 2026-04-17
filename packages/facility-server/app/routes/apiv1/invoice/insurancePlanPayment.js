import asyncHandler from 'express-async-handler';
import express from 'express';

export const insurancePlanPaymentRoute = express.Router();

insurancePlanPaymentRoute.get(
  '/:invoiceId/insurancePlanPayments',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'InvoicePayment');

    const invoiceId = req.params.invoiceId;
    const insurancePlanPayments = await req.models.InvoiceInsurancePlanPayment.findAll({
      include: [
        { model: req.models.InvoicePayment, as: 'detail', where: { invoiceId } },
        { model: req.models.InvoiceInsurancePlan, as: 'insurancePlan' },
      ],
    }).then(payments =>
      payments.map(payment => ({
        id: payment.invoicePaymentId,
        date: payment.detail.date,
        amount: payment.detail.amount,
        receiptNumber: payment.detail.receiptNumber,
        insurancePlanName: payment.insurancePlan.name,
        status: payment.status,
      })),
    );

    res.json({ count: insurancePlanPayments.length, data: insurancePlanPayments });
  }),
);
