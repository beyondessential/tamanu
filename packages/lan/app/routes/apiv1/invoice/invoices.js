import express from 'express';
import asyncHandler from 'express-async-handler';
import { customAlphabet } from 'nanoid';
import { NotFoundError, InvalidParameterError } from 'shared/errors';
import { INVOICE_STATUSES, INVOICE_PAYMENT_STATUSES } from '@tamanu/constants';
import { simplePut } from '../crudHelpers';

import { invoiceLineItemsRoute } from './invoiceLineItems';
import { invoicePriceChangeItemsRoute } from './invoicePriceChangeItems';

const invoiceRoute = express.Router();
export { invoiceRoute as invoices };

invoiceRoute.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Encounter');

    const { models, body } = req;
    const { encounterId } = body;
    if (!encounterId) {
      throw new InvalidParameterError('Missing encounterId');
    }
    const encounter = await models.Encounter.findByPk(encounterId);
    if (!encounter) {
      throw new NotFoundError(`Unable to find encounter ${encounterId}`);
    }
    req.checkPermission('write', 'Invoice');

    const { patientId, id, patientBillingTypeId: encounterPatientBillingTypeId } = encounter;

    const displayId =
      customAlphabet('0123456789', 8)() + customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)();
    // Create a corresponding invoice with the encounter when admitting patient
    const invoice = await models.Invoice.create({
      encounterId: id,
      displayId,
      status: INVOICE_STATUSES.IN_PROGRESS,
      paymentStatus: INVOICE_PAYMENT_STATUSES.UNPAID,
    });

    const patientAdditionalData = await models.PatientAdditionalData.findOne({
      where: { patientId },
    });

    // We expect to always have a patient additional data corresponding to a patient
    if (!patientAdditionalData) {
      // eslint-disable-next-line no-console
      console.warn(`No PatientAdditionalData found for patient with ID: ${patientId}`);
    }

    const invoicePriceChangeType = await models.InvoicePriceChangeType.findOne({
      where: {
        itemId: encounterPatientBillingTypeId || patientAdditionalData?.patientBillingTypeId,
      },
    });

    // automatically apply price change (discount) based on patientBillingType
    if (invoicePriceChangeType) {
      await models.InvoicePriceChangeItem.create({
        description: invoicePriceChangeType.name,
        percentageChange: invoicePriceChangeType.percentageChange,
        invoicePriceChangeTypeId: invoicePriceChangeType.id,
        invoiceId: invoice.id,
      });
    }
    res.send(invoice);
  }),
);
invoiceRoute.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Invoice');

    const { models, params } = req;
    const invoiceId = params.id;
    const invoice = await models.Invoice.findOne({
      include: [
        {
          model: models.Encounter,
          as: 'encounter',
        },
      ],
      where: { id: invoiceId },
    });

    req.checkPermission('read', invoice);

    res.send(invoice);
  }),
);

invoiceRoute.put('/:id', simplePut('Invoice'));

invoiceRoute.use(invoiceLineItemsRoute);
invoiceRoute.use(invoicePriceChangeItemsRoute);
