import express from 'express';
import asyncHandler from 'express-async-handler';
import { customAlphabet } from 'nanoid';
import { ValidationError, NotFoundError, ForbiddenError } from '@tamanu/shared/errors';
import { INVOICE_PAYMENT_STATUSES, INVOICE_STATUSES, SETTING_KEYS } from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Op } from 'sequelize';
import { invoiceItemsRoute } from './invoiceItems';
import {
  getCurrentCountryTimeZoneDateString,
  getCurrentCountryTimeZoneDateTimeString,
} from '@tamanu/shared/utils/countryDateTime';

const invoiceRoute = express.Router();
export { invoiceRoute as invoices };

//* Create invoice
const createInvoiceSchema = z
  .object({
    encounterId: z.string().uuid(),
    discount: z
      .object({
        percentage: z.coerce
          .number()
          .min(0)
          .max(1),
        reason: z.string().optional(),
        isManual: z.boolean(),
      })
      .strip()
      .optional(),
  })
  .strip()
  .transform(data => ({
    ...data,
    id: uuidv4(),
    displayId:
      customAlphabet('0123456789', 8)() + customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)(),
    status: INVOICE_STATUSES.IN_PROGRESS,
    paymentStatus: INVOICE_PAYMENT_STATUSES.UNPAID,
    date: getCurrentCountryTimeZoneDateString(),
  }));
invoiceRoute.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Invoice');

    const { data, error } = await createInvoiceSchema.safeParseAsync(req.body);
    if (error) throw new ValidationError(error.message);

    // get encounter
    const encounter = await req.models.Encounter.findByPk(data.encounterId, {
      attributes: ['patientId'],
    });
    if (!encounter) throw new ValidationError(`encounter ${data.encounterId} not found`);

    const insurerId = await req.models.PatientAdditionalData.findOne({
      where: { patientId: encounter.patientId },
      attributes: ['insurerId'],
    }).then(patientData => patientData?.insurerId);
    const insurerPercentage = await req.settings.get(SETTING_KEYS.INSURER_DEFAUlT_CONTRIBUTION);
    const defaultInsurer =
      insurerId && insurerPercentage ? { insurerId, percentage: insurerPercentage } : null;

    // create invoice transaction
    const transaction = await req.db.transaction();

    try {
      //create invoice
      const invoice = await req.models.Invoice.create(data, { transaction });

      // insert default insurer
      if (defaultInsurer)
        await req.models.InvoiceInsurer.create(
          { invoiceId: data.id, ...defaultInsurer },
          { transaction },
        );

      // create invoice discount
      if (data.discount)
        await req.models.InvoiceDiscount.create(
          {
            ...data.discount,
            invoiceId: data.id,
            appliedByUserId: req.user.id,
            appliedTime: getCurrentCountryTimeZoneDateTimeString(),
          },
          { transaction },
        );

      await transaction.commit();
      res.json(invoice);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }),
);

//* Update invoice
const updateInvoiceSchema = z
  .object({
    discount: z
      .object({
        id: z
          .string()
          .uuid()
          .default(uuidv4),
        percentage: z.coerce
          .number()
          .min(0)
          .max(1),
        reason: z.string().optional(),
        isManual: z.boolean(),
      })
      .strip()
      .optional(),
    insurers: z
      .object({
        id: z
          .string()
          .uuid()
          .default(uuidv4),
        percentage: z.coerce
          .number()
          .min(0)
          .max(1),
        insurerId: z.string(),
      })
      .strip()
      .array(),
    items: z
      .object({
        id: z
          .string()
          .uuid()
          .default(uuidv4),
        orderDate: z.string().date(),
        orderedByUserId: z.string().uuid(),
        productId: z.string(),
        quantity: z.coerce.number().default(0),
        sourceId: z
          .string()
          .uuid()
          .optional(),
        discount: z
          .object({
            id: z
              .string()
              .uuid()
              .default(uuidv4),
            percentage: z.coerce
              .number()
              .min(-1)
              .max(1),
            reason: z.string().optional(),
          })
          .strip()
          .optional(),
      })
      .strip()
      .array(),
  })
  .strip();

invoiceRoute.put(
  '/:id/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Invoice');

    const invoiceId = req.params.id;

    const foundInvoice = await req.models.Invoice.findByPk(invoiceId);
    if (!foundInvoice) throw new NotFoundError(`Unable to find invoice ${invoiceId}`);

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

      //remove any existing insurer if insurer ids are not matching
      await req.models.InvoiceInsurer.destroy(
        { where: { invoiceId, id: { [Op.notIn]: data.insurers.map(insurer => insurer.id) } } },
        { transaction },
      );
      //update or create insurers
      for (const insurer of data.insurers) {
        await req.models.InvoiceInsurer.upsert({ ...insurer, invoiceId }, { transaction });
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

async function freezeInvoiceItemsData(req, transaction) {
  const items = await req.models.InvoiceItem.findAll(
    {
      where: { invoiceId: req.params.id },
      include: {
        model: req.models.InvoiceProduct,
        as: 'product',
        attributes: ['name', 'price'],
      },
    },
    { transaction },
  );

  await req.models.InvoiceItem.bulkCreate(
    items.map(item => {
      const plain = item.get();
      return {
        ...plain,
        productName: plain.product.name,
        productPrice: plain.product.price,
      };
    }),
    { updateOnDuplicate: ['productName', 'productPrice'], transaction },
  );
}

invoiceRoute.put(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

    const transaction = await req.db.transaction();

    try {
      await freezeInvoiceItemsData(req, transaction);

      await req.models.Invoice.update(
        { status: INVOICE_STATUSES.CANCELLED },
        { where: { id: req.params.id, paymentStatus: INVOICE_PAYMENT_STATUSES.UNPAID } },
        { transaction },
      );
      await transaction.commit();
      res.send({});
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }),
);

invoiceRoute.put(
  '/:id/finalize',
  asyncHandler(async (req, res) => {
    if (req.models) {
      throw new NotFoundError();
    }
    req.checkPermission('write', 'Invoice');

    //assert invoice status = in progress
    const isInProgress = req.models.Invoice.findByPk(req.params.id, {
      attributes: ['status'],
    }).then(invoice => (!invoice ? false : invoice.status === INVOICE_STATUSES.IN_PROGRESS));
    if (!isInProgress) throw new ForbiddenError('Invoice not in progress');

    const transaction = await req.db.transaction();

    try {
      await freezeInvoiceItemsData(req, transaction);

      const invoice = await req.models.Invoice.update(
        { status: INVOICE_STATUSES.FINALISED },
        { where: { id: req.params.id, status: INVOICE_STATUSES.IN_PROGRESS } },
        { transaction },
      );
      await transaction.commit();
      res.json(invoice);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }),
);

invoiceRoute.use(invoiceItemsRoute);
