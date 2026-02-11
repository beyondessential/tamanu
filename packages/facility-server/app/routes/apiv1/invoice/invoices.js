import express from 'express';
import asyncHandler from 'express-async-handler';
import { keyBy, round } from 'lodash';
import { ValidationError, NotFoundError, InvalidOperationError } from '@tamanu/errors';
import {
  INVOICE_ITEMS_DISCOUNT_TYPES,
  INVOICE_STATUSES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Op } from 'sequelize';
import { getInvoiceItemPrice } from '@tamanu/shared/utils';
import { generateInvoiceDisplayId } from '@tamanu/utils/generateInvoiceDisplayId';
import { invoiceItemsRoute } from './invoiceItems';
import { getCurrentGlobalTimeZoneDateTimeString } from '@tamanu/shared/utils/globalDateTime';
import { patientPaymentRoute } from './patientPayment';
import { insurancePlansRoute } from './insurancePlans';

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
        isHidden: false,
      },
      attributes: ['price'],
    });

    res.json(item);
  }),
);

// Return insurance plan items for a given encounter and product
invoiceRoute.get(
  '/insurance-plan-items',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Invoice');

    const { encounterId, productId } = req.query;

    if (!encounterId || !productId) {
      throw new ValidationError('encounterId and productId are required');
    }

    const { Invoice, InvoiceInsurancePlanItem, InvoiceInsurancePlan, InvoiceProduct } = req.models;

    // If the product is not insurable, there are no insurance plan items to return
    const product = await InvoiceProduct.findByPk(productId, { attributes: ['id', 'insurable'] });
    if (!product || product.insurable !== true) {
      return res.json([]);
    }

    // Find the invoice for the encounter (there should be at most one per encounter)
    const invoice = await Invoice.findOne({
      where: { encounterId },
      attributes: ['id'],
      include: [
        {
          model: InvoiceInsurancePlan,
          as: 'insurancePlans',
          attributes: ['name', 'id', 'defaultCoverage'],
          where: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
        },
      ],
    });

    if (!invoice) {
      // If no invoice yet, there will be no linked plans
      return res.json([]);
    }

    // Get the plan items for this product and the linked plans
    const items = await InvoiceInsurancePlanItem.findAll({
      where: {
        invoiceProductId: productId,
      },
      attributes: ['invoiceInsurancePlanId', 'coverageValue'],
      include: [
        {
          model: InvoiceInsurancePlan,
          as: 'invoiceInsurancePlan',
          required: true,
          attributes: ['name', 'id'],
        },
      ],
    });

    const itemsById = keyBy(items, 'invoiceInsurancePlanId');

    // Normalise to the shape expected by the client UI
    const response = invoice.insurancePlans.map(insurancePlan => {
      const planItem = itemsById[insurancePlan.id];
      const coverageValue = planItem?.coverageValue ?? insurancePlan.defaultCoverage;
      return {
        id: insurancePlan.id,
        label: insurancePlan.name,
        coverageValue,
      };
    });

    res.json(response);
  }),
);

//* Create invoice
const createInvoiceSchema = z
  .object({
    encounterId: z.string().uuid(),
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
    const { body, models } = req;

    const { data, error } = await createInvoiceSchema.safeParseAsync(body);
    if (error) throw new ValidationError(error.message);

    // get encounter
    const encounter = await req.models.Encounter.findByPk(data.encounterId, {
      attributes: ['patientId'],
    });
    if (!encounter) throw new ValidationError(`encounter ${data.encounterId} not found`);

    // Ensure no other invoice exists for the same encounter
    const existingInvoice = await req.models.Invoice.findOne({
      where: {
        encounterId: data.encounterId,
      },
    });
    if (existingInvoice)
      throw new InvalidOperationError('An invoice already exists for this encounter');

    const invoice = await models.Invoice.create(data);
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
        manualEntryPrice: z.coerce
          .number()
          .transform(amount => round(amount, 2))
          .nullish(),
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
        approved: z.boolean().default(false),
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

    // Only in-progress invoices can be updated via this endpoint
    // For approval changes on finalised invoices, use PUT /:id/items/:itemId/approval
    if (foundInvoice.status !== INVOICE_STATUSES.IN_PROGRESS) {
      throw new InvalidOperationError('Only in progress invoices can be updated.');
    }

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
            appliedTime: getCurrentGlobalTimeZoneDateTimeString(),
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
 * Finalise invoice
 * - An invoice cannot be finalised until the encounter has been discharged
 * - Only in progress invoices can be finalised
 * - Invoice items data will be frozen
 */
invoiceRoute.put(
  '/:id/finalise',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');
    const { models, params } = req;
    const invoiceId = params.id;
    const { Invoice, InvoicePriceList, InvoiceItem, InvoiceItemFinalisedInsurance } = models;

    const invoice = await Invoice.findByPk(invoiceId, {
      attributes: ['id', 'status', 'encounterId'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== INVOICE_STATUSES.IN_PROGRESS) {
      throw new InvalidOperationError('Only in progress invoices can be finalised');
    }

    // An encounter is considered closed if it has an end date
    const encounter = await req.models.Encounter.findByPk(invoice.encounterId, {
      attributes: ['endDate'],
    });

    if (!encounter) {
      throw new NotFoundError('Encounter not found for this invoice.');
    }

    if (!encounter.endDate) {
      throw new InvalidOperationError(
        'Invoice cannot be finalised until the encounter has been discharged',
      );
    }

    const invoicePriceListId = await InvoicePriceList.getIdForPatientEncounter(invoice.encounterId);

    const associations = InvoiceItem.getListReferenceAssociations(models, invoicePriceListId);
    const invoiceItems = await InvoiceItem.findAll({
      where: { invoiceId },
      include: associations,
    });

    const transaction = await req.db.transaction();

    try {
      // Copy product details to the invoice item final fields
      for (const item of invoiceItems) {
        if (item.product) {
          item.productNameFinal = item.product.name;
          item.productCodeFinal = item.product.getProductCode();

          item.priceFinal = getInvoiceItemPrice(item);

          // Save insurance plan coverage values
          if (item.product.invoiceInsurancePlanItems?.length > 0) {
            for (const insurancePlanItem of item.product.invoiceInsurancePlanItems) {
              await InvoiceItemFinalisedInsurance.create(
                {
                  id: uuidv4(),
                  invoiceItemId: item.id,
                  coverageValueFinal: insurancePlanItem.coverageValue,
                  invoiceInsurancePlanId: insurancePlanItem.invoiceInsurancePlanId,
                },
                { transaction },
              );
            }
          }

          await item.save({ transaction });
        }
      }

      invoice.status = INVOICE_STATUSES.FINALISED;
      await invoice.save({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    res.json(invoice);
  }),
);

/**
 * Update invoice item approval status
 * - Can be used on both in-progress and finalised invoices
 */
invoiceRoute.put(
  '/:id/items/:itemId/approval',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

    const { id: invoiceId, itemId } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      throw new ValidationError('approved must be a boolean');
    }

    const invoice = await req.models.Invoice.findByPk(invoiceId, {
      attributes: ['id', 'status'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Allow approval changes on both IN_PROGRESS and FINALISED invoices
    if (![INVOICE_STATUSES.IN_PROGRESS, INVOICE_STATUSES.FINALISED].includes(invoice.status)) {
      throw new InvalidOperationError(
        'Approval can only be changed on in-progress or finalised invoices',
      );
    }

    const invoiceItem = await req.models.InvoiceItem.findOne({
      where: { id: itemId, invoiceId },
    });

    if (!invoiceItem) {
      throw new NotFoundError('Invoice item not found');
    }

    invoiceItem.approved = approved;
    await invoiceItem.save();

    res.json({ id: invoiceItem.id, approved: invoiceItem.approved });
  }),
);

/**
 * Bulk update invoice item approval status
 * - Can be used on both in-progress and finalised invoices
 */
invoiceRoute.put(
  '/:id/items/approval',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

    const { id: invoiceId } = req.params;
    const { approved } = req.body;

    if (typeof approved !== 'boolean') {
      throw new ValidationError('approved must be a boolean');
    }

    const invoice = await req.models.Invoice.findByPk(invoiceId, {
      attributes: ['id', 'status'],
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Allow approval changes on both IN_PROGRESS and FINALISED invoices
    if (![INVOICE_STATUSES.IN_PROGRESS, INVOICE_STATUSES.FINALISED].includes(invoice.status)) {
      throw new InvalidOperationError(
        'Approval can only be changed on in-progress or finalised invoices',
      );
    }

    await req.models.InvoiceItem.update({ approved }, { where: { invoiceId } });

    const updatedItems = await req.models.InvoiceItem.findAll({
      where: { invoiceId },
      attributes: ['id', 'approved'],
    });

    res.json(updatedItems);
  }),
);

invoiceRoute.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'Invoice');
    const invoiceId = req.params.id;

    const invoice = await req.models.Invoice.findByPk(invoiceId, {
      attributes: ['id', 'status'],
    });
    if (!invoice) throw new NotFoundError('Invoice not found');

    // Finalised invoices cannot be deleted
    if (invoice.status === INVOICE_STATUSES.FINALISED) {
      throw new InvalidOperationError('Finalised invoices cannot be deleted');
    }

    await invoice.destroy();

    res.status(204).send();
  }),
);

invoiceRoute.use(invoiceItemsRoute);
invoiceRoute.use(patientPaymentRoute);
invoiceRoute.use(insurancePlansRoute);
