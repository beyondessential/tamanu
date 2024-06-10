import express from 'express';
import asyncHandler from 'express-async-handler';
import { customAlphabet } from 'nanoid';
import { ValidationError, NotFoundError } from '@tamanu/shared/errors';
import { INVOICE_PAYMENT_STATUSES, INVOICE_STATUSES } from '@tamanu/constants';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Op } from 'sequelize';

const invoiceRoute = express.Router();
export { invoiceRoute as invoices };

//* Create invoice
const createInvoiceSchema = z
  .object({
    encounterId: z.string().uuid(),
    discount: z
      .object({
        percentage: z
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
  }));
invoiceRoute.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

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
    const insurerPercentage = await req.models.Setting.findOne({
      where: { key: 'insurer.defaultContribution' },
    })
      .then(setting => JSON.parse(setting.value))
      .catch(() => null);
    const defaultInsurer =
      insurerId && insurerPercentage ? { insurerId, percentage: insurerPercentage } : null;

    // create invoice transaction
    const transaction = await req.db.transaction();

    try {
      //create invoice
      await req.models.Invoice.create(data, { transaction });

      // insert default insurer
      if (defaultInsurer)
        await req.models.InvoiceInsurer.create(
          { invoiceId: data.id, ...defaultInsurer },
          { transaction },
        );

      // create invoice discount
      if (data.discount)
        await req.models.InvoiceDiscount.create(
          { invoiceId: data.id, ...data.discount },
          { transaction },
        );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const invoice = await req.models.Invoice.findByPk(data.id, {
      include: [
        { model: req.models.Encounter, as: 'encounter' },
        {
          model: req.models.InvoiceDiscount,
          as: 'discount',
          include: [{ model: req.models.User, as: 'appliedByUser', attributes: ['displayName'] }],
        },
        {
          model: req.models.InvoiceInsurer,
          as: 'insurers',
          include: [
            {
              model: req.models.ReferenceData,
              as: 'insurer',
            },
          ],
        },
      ],
    });
    res.json(invoice.dataValues);
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
          .default(uuidv4()),
        percentage: z
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
          .default(uuidv4()),
        percentage: z
          .number()
          .min(0)
          .max(1),
        insurerId: z.string().uuid(),
      })
      .strip()
      .array(),
    items: z
      .object({
        id: z
          .string()
          .uuid()
          .default(uuidv4()),
        orderDate: z.date(),
        orderedByUserId: z.string().uuid(),
        productId: z.string(),
        discount: z
          .object({
            id: z
              .string()
              .uuid()
              .default(uuidv4()),
            percentage: z
              .number()
              .min(0)
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
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

    const invoiceId = req.params.id;

    const foundInvoice = await req.models.Invoice.findByPk(invoiceId);
    if (!foundInvoice) throw new NotFoundError(`Unable to find invoice ${invoiceId}`);

    const { data, error } = await updateInvoiceSchema.safeParseAsync(req.body);
    if (error) throw new ValidationError(error.message);

    const transaction = await req.db.transaction();

    try {
      //update invoice discount
      await req.models.InvoiceDiscount.destroy(
        { where: { invoiceId, id: { [Op.ne]: data.discount?.id ? [data.discount.id] : [] } } },
        { transaction },
      );

      await req.models.InvoiceDiscount.upsert(
        { ...data.discount, invoiceId },
        { conflictFields: ['id', 'invoiceId'], transaction },
      );

      //update invoice insurers
      await req.models.InvoiceInsurer.destroy(
        { where: { invoiceId, id: { [Op.notIn]: data.insurers.map(insurer => insurer.id) } } },
        { transaction },
      );

      for (const insurer of data.insurers) {
        await req.models.InvoiceInsurer.upsert(
          { ...insurer, invoiceId },
          { conflictFields: ['id', 'invoiceId'], transaction },
        );
      }

      //update invoice items
      await req.models.InvoiceItem.destroy(
        { where: { invoiceId, id: { [Op.notIn]: data.items.map(item => item.id) } } },
        { transaction },
      );

      for (const item of data.items) {
        await req.models.InvoiceItem.upsert(
          { ...item, invoiceId },
          { conflictFields: ['id', 'invoiceId'], transaction },
        );

        //update invoice item discount
        await req.models.InvoiceItemDiscount.destroy(
          {
            where: {
              invoiceItemId: item.id,
              id: { [Op.ne]: item.discount?.id ? [item.discount.id] : [] },
            },
          },
          { transaction },
        );

        await req.models.InvoiceItemDiscount.upsert(
          { ...item.discount, invoiceItemId: item.id },
          { conflictFields: ['id', 'invoiceItemId'], transaction },
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const invoice = await req.models.Invoice.findByPk(data.id, {
      include: [
        { model: req.models.Encounter, as: 'encounter' },
        {
          model: req.models.InvoiceDiscount,
          as: 'discount',
          include: [{ model: req.models.User, as: 'appliedByUser', attributes: ['displayName'] }],
        },
        {
          model: req.models.InvoiceInsurer,
          as: 'insurers',
          include: [
            {
              model: req.models.ReferenceData,
              as: 'insurer',
            },
          ],
        },
        {
          model: req.models.InvoiceItem,
          as: 'items',
          include: [
            {
              model: req.models.InvoiceItemDiscount,
              as: 'discount',
            },
            {
              model: req.models.InvoiceProduct,
              as: 'product',
              include: [
                {
                  model: req.models.ReferenceData,
                  as: 'referenceData',
                },
                {
                  model: req.models.LabTestType,
                  as: 'labTestType',
                },
              ],
            },
          ],
        },
      ],
    });
    res.json(invoice.dataValues);
  }),
);
