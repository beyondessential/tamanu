import express from 'express';
import asyncHandler from 'express-async-handler';
import { customAlphabet } from 'nanoid';
import { InvalidParameterError, NotFoundError } from '@tamanu/shared/errors';
import { INVOICE_PAYMENT_STATUSES, INVOICE_STATUSES } from '@tamanu/constants';
import { simplePut } from '@tamanu/shared/utils/crudHelpers';

import { invoiceLineItemsRoute } from './invoiceLineItems';

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

    const { id } = encounter;

    const displayId =
      customAlphabet('0123456789', 8)() + customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)();
    // Create a corresponding invoice with the encounter when admitting patient
    const invoice = await models.Invoice.create({
      encounterId: id,
      displayId,
      status: INVOICE_STATUSES.IN_PROGRESS,
      paymentStatus: INVOICE_PAYMENT_STATUSES.UNPAID,
    });

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
