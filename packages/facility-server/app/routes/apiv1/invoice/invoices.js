import express from 'express';
import asyncHandler from 'express-async-handler';
import { ValidationError, NotFoundError, InvalidOperationError } from '@tamanu/errors';
import { INVOICE_ITEMS_DISCOUNT_TYPES, INVOICE_STATUSES } from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Op } from 'sequelize';
import { invoiceItemsRoute } from './invoiceItems';
import { getCurrentCountryTimeZoneDateTimeString } from '@tamanu/shared/utils/countryDateTime';
import { patientPaymentRoute } from './patientPayment';
import { insurancePlansRoute } from './insurancePlans';
import { round } from 'lodash';
import { generateInvoiceDisplayId } from '@tamanu/utils/generateInvoiceDisplayId';

const invoiceRoute = express.Router();
export { invoiceRoute as invoices };

invoiceRoute.get(
  '/price-list-item',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Invoice');

    const { encounterId, productId } = req.query;

    if (!encounterId || !productId) {
      throw new ValidationError('encounterId and productId are required');
    }

    const { InvoicePriceList, InvoicePriceListItem } = req.models;

    const invoicePriceListId = await InvoicePriceList.getIdForPatientEncounter(encounterId);

    if (!invoicePriceListId) {
      throw new NotFoundError('Invoice Price List not found');
    }

    const item = await InvoicePriceListItem.findOne({
      where: {
        invoicePriceListId,
        invoiceProductId: productId,
      },
      attributes: ['price'],
    });

    res.json({ price: item ? item.price : null });
  }),
);

//* Create invoice
const createInvoiceSchema = z
  .object({
    encounterId: z.string().uuid(),
    discount: z
      .object({
        percentage: z.coerce
          .number()
          .min(0)
          .max(1)
          .transform(amount => round(amount, 2)),
        reason: z.string().nullish(),
        isManual: z.boolean(),
      })
      .strip()
      .nullish(),
    date: z.string(),
  })
  .strip()
  .transform(data => ({
    ...data,
    id: uuidv4(),
    displayId: generateInvoiceDisplayId(),
    status: INVOICE_STATUSES.IN_PROGRESS,
  }));
invoiceRoute.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Invoice');
    const { body } = req;

    const { data, error } = await createInvoiceSchema.safeParseAsync(body);
    if (error) throw new ValidationError(error.message);

    // get encounter
    const encounter = await req.models.Encounter.findByPk(data.encounterId, {
      attributes: ['patientId'],
    });
    if (!encounter) throw new ValidationError(`encounter ${data.encounterId} not found`);

    // Handles invoice creation with default insurer and discount
    const invoice = await req.models.Invoice.initializeInvoice(req.user.id, data);
    res.json(invoice);
  }),
);

//* Update invoice
const updateInvoiceSchema = z
  .object({
    discount: z
      .object({
        id: z.string().uuid().default(uuidv4),
        percentage: z.coerce
          .number()
          .min(0)
          .max(1)
          .transform(amount => round(amount, 2)),
        reason: z.string().nullish(),
        isManual: z.boolean(),
      })
      .strip()
      .nullish(),
    items: z
      .object({
        id: z.string().uuid().default(uuidv4),
        orderDate: z.string().date(),
        orderedByUserId: z.string(),
        productId: z.string(),
        productName: z.string().nullish(),
        productPrice: z.coerce
          .number()
          .transform(amount => round(amount, 2))
          .nullish(),
        productCode: z.string().default('').nullish(),
        productDiscountable: z.boolean().default(true),
        quantity: z.coerce.number().default(1),
        note: z.string().nullish(),
        sourceId: z.string().uuid().nullish(),
        discount: z
          .object({
            id: z.string().uuid().default(uuidv4),
            type: z.enum(Object.values(INVOICE_ITEMS_DISCOUNT_TYPES)),
            amount: z.coerce.number().transform(amount => round(amount, 2)),
            reason: z.string().nullish(),
          })
          .strip()
          .nullish(),
      })
      .strip()
      .refine(item => {
        if (!item.discount) return true;
        if (item.discount.type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE) {
          return item.discount.amount >= -1 && item.discount.amount <= 1;
        }
        // If productPrice is not provided, we can't validate against total price
        if (item.productPrice === undefined) return true;
        return item.discount.amount <= item.productPrice * item.quantity;
      }, 'Invalid discount amount')
      .array(),
  })
  .strip();

/**
 * Update invoice
 * - Only in progress invoices can be updated
 */
invoiceRoute.put(
  '/:id/',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

    const invoiceId = req.params.id;

    const foundInvoice = await req.models.Invoice.findByPk(invoiceId);
    if (!foundInvoice) throw new NotFoundError(`Unable to find invoice ${invoiceId}`);

    //* Only in progress invoices can be updated
    if (foundInvoice.status !== INVOICE_STATUSES.IN_PROGRESS)
      throw new InvalidOperationError('Only in progress invoices can be updated');

    const { data, error } = await updateInvoiceSchema.safeParseAsync(req.body);
    if (error) throw new ValidationError(error.message);

    const transaction = await req.db.transaction();

    try {
      if (!data.discount) {
        //remove any existing discount if discount info is not provided
        await req.models.InvoiceDiscount.destroy({ where: { invoiceId } }, { transaction });
      }
      //if discount info is provided, update or create discount
      else {
        //remove any existing discount if discount id is not matching
        await req.models.InvoiceDiscount.destroy(
          { where: { invoiceId, id: { [Op.ne]: data.discount.id } } },
          { transaction },
        );
        //update or create discount
        await req.models.InvoiceDiscount.upsert(
          {
            ...data.discount,
            invoiceId,
            appliedByUserId: req.user.id,
            appliedTime: getCurrentCountryTimeZoneDateTimeString(),
          },
          { transaction },
        );
      }

      //remove any existing item if item ids are not matching
      await req.models.InvoiceItem.destroy(
        { where: { invoiceId, id: { [Op.notIn]: data.items.map(item => item.id) } } },
        { transaction },
      );

      for (const item of data.items) {
        const { discount: itemDiscount, ...itemData } = item;
        //update or create item
        await req.models.InvoiceItem.upsert({ ...itemData, invoiceId }, { transaction });

        //remove any existing discount if discount info is not provided
        if (!itemDiscount) {
          await req.models.InvoiceItemDiscount.destroy(
            { where: { invoiceItemId: item.id } },
            { transaction },
          );
        } else {
          //remove any existing discount if discount id is not matching
          await req.models.InvoiceItemDiscount.destroy(
            {
              where: {
                invoiceItemId: item.id,
                id: { [Op.ne]: itemDiscount.id },
              },
            },
            { transaction },
          );
          //update or create discount
          await req.models.InvoiceItemDiscount.upsert(
            { ...itemDiscount, invoiceItemId: item.id },
            { transaction },
          );
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const invoice = await req.models.Invoice.findByPk(invoiceId);
    res.json(invoice.dataValues);
  }),
);

/**
 * Cancel invoice
 */
invoiceRoute.put(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

    const invoiceId = req.params.id;
    const invoice = await req.models.Invoice.findByPk(invoiceId, {
      attributes: ['id', 'status'],
    });
    if (!invoice) throw new NotFoundError('Invoice not found');

    //only in progress invoices can be cancelled
    if (invoice.status !== INVOICE_STATUSES.IN_PROGRESS) {
      throw new InvalidOperationError('Only in progress invoices can be cancelled');
    }

    invoice.status = INVOICE_STATUSES.CANCELLED;
    await invoice.save();
    res.send(invoice);
  }),
);

/**
 * Finalize invoice
 * - An invoice cannot be finalised until the Encounter has been closed
 * - Only in progress invoices can be finalised
 * - Invoice items data will be frozen
 */
invoiceRoute.put(
  '/:id/finalize',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');
    const invoiceId = req.params.id;
    const invoice = await req.models.Invoice.findByPk(invoiceId, {
      attributes: ['id', 'status'],
    });
    if (!invoice) throw new NotFoundError('Invoice not found');

    //only in progress invoices can be finalised
    if (invoice.status !== INVOICE_STATUSES.IN_PROGRESS) {
      throw new InvalidOperationError('Only in progress invoices can be finalised');
    }

    //An invoice cannot be finalised until the Encounter has been closed
    //an encounter is considered closed if it has an end date
    const encounterClosed = await req.models.Encounter.findByPk(invoice.encounterId, {
      attributes: ['endDate'],
    }).then(encounter => !!encounter?.endDate);

    if (encounterClosed) {
      throw new InvalidOperationError(
        'Ivnvoice cannot be finalised until the Encounter has been closed',
      );
    }

    invoice.status = INVOICE_STATUSES.FINALISED;
    await invoice.save();
    res.json(invoice);
  }),
);
/**
 * Finalize invoice
 * You cannot delete a Finalised invoice
 * You can delete a cancelled or in progress invoice
 */
invoiceRoute.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'Invoice');
    const invoiceId = req.params.id;

    const invoice = await req.models.Invoice.findByPk(invoiceId, {
      attributes: ['id', 'status'],
    });
    if (!invoice) throw new NotFoundError('Invoice not found');

    //Finalised invoices cannot be deleted
    if (invoice.status === INVOICE_STATUSES.FINALISED) {
      throw new InvalidOperationError('Only in progress invoices can be finalised');
    }

    await invoice.destroy();

    res.status(204).send();
  }),
);

invoiceRoute.use(invoiceItemsRoute);
invoiceRoute.use(patientPaymentRoute);
invoiceRoute.use(insurancePlansRoute);
