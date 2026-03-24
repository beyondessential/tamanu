import { INVOICE_STATUSES } from '@tamanu/constants';
import { getInvoiceSummary } from '@tamanu/utils/invoice';
import { NotFoundError } from '@tamanu/errors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import Decimal from 'decimal.js';
import { invoiceForResponse } from '../invoice/invoiceForResponse';

export const patientInvoiceRoutes = express.Router();

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
      return invoiceForResponse(hydratedInvoiceRecord);
    }),
  );
}

const encounterOrderByKeys = ['encounterType'];
const invoiceOrderByKeys = ['date', 'displayId', 'patientPaymentStatus', 'status'];

const buildInvoiceOrderClause = ({ order, orderBy, models }) => {
  if (!orderBy) return undefined;

  const direction = String(order).toUpperCase();

  if (invoiceOrderByKeys.includes(orderBy)) {
    return [[orderBy, direction]];
  }

  if (encounterOrderByKeys.includes(orderBy)) {
    return [[{ model: models.Encounter, as: 'encounter' }, orderBy, direction]];
  }

  return undefined;
};

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
        },
      ],
      order: buildInvoiceOrderClause({ order, orderBy, models }),
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

// Calculate total balance from invoices
const calculateTotalBalance = invoices => {
  const balance = invoices.reduce((sum, invoice) => {
    const invoiceAmount = new Decimal(getInvoiceSummary(invoice).patientPaymentRemainingBalance);
    return sum.add(invoiceAmount);
  }, new Decimal(0));
  return balance.toNumber();
};

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
