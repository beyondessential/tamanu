import { INVOICE_STATUSES } from '@tamanu/constants';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { NotFoundError } from '@tamanu/errors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { mapInsurancePlanItems } from '../invoice/mapInsurancePlanItems';

export const patientInvoiceRoutes = express.Router();

const encounterOrderByKeys = ['encounterType'];
const invoiceOrderByKeys = ['date', 'displayId', 'status'];

// Shared function to hydrate invoices with price list associations
async function hydrateInvoices(invoiceRecords, models) {
  return Promise.all(
    invoiceRecords.map(async invoiceRecord => {
      const { Invoice, InvoicePriceList } = models;
      // Determine the price list for the invoice based on its encounter
      const invoiceId = invoiceRecord.id;
      const encounterId = invoiceRecord.encounterId;
      const invoicePriceListId = await InvoicePriceList.getIdForPatientEncounter(encounterId);

      // Refetch the invoice with associations that depend on the price list
      const hydratedInvoiceRecord = await Invoice.findOne({
        where: { id: invoiceId },
        include: Invoice.getFullReferenceAssociations(invoicePriceListId),
      });

      if (!hydratedInvoiceRecord) {
        throw new NotFoundError('Invoice not found');
      }

      const invoice = hydratedInvoiceRecord.get({ plain: true });
      const invoiceItemsResponse = invoice.items.map(mapInsurancePlanItems(invoice.insurancePlans));
      return { ...invoice, items: invoiceItemsResponse };
    }),
  );
}

// Shared function to calculate total balance from invoices
function calculateTotalBalance(invoices) {
  return invoices.reduce(
    (acc, invoice) => acc + getInvoiceSummary(invoice).patientPaymentRemainingBalance,
    0,
  );
}

patientInvoiceRoutes.get(
  '/:id/invoices',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Invoice');

    const { models, params, query } = req;
    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0 } = query;
    const patientId = params.id;

    const data = await models.Invoice.findAll({
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          where: { patientId },
          order:
            orderBy && encounterOrderByKeys.includes(orderBy)
              ? [[orderBy, order.toUpperCase()]]
              : undefined,
        },
      ],
      order:
        orderBy && invoiceOrderByKeys.includes(orderBy)
          ? [[orderBy, order.toUpperCase()]]
          : undefined,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    const count = await models.Invoice.count({
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          where: { patientId },
        },
      ],
    });

    const dataResponse = await hydrateInvoices(data, models);

    res.send({
      count,
      data: dataResponse,
    });
  }),
);

patientInvoiceRoutes.get(
  '/:id/invoices/totalOutstandingBalance',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Invoice');

    const { models, params } = req;
    const patientId = params.id;

    const invoices = await models.Invoice.findAll({
      where: {
        status: INVOICE_STATUSES.FINALISED,
      },
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
          where: { patientId },
        },
      ],
    });

    const dataResponse = await hydrateInvoices(invoices, models);
    const balance = calculateTotalBalance(dataResponse);

    res.send({
      result: balance,
    });
  }),
);
