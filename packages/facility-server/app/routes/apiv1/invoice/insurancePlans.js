import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { NotFoundError, InvalidOperationError, ValidationError } from '@tamanu/errors';

export const insurancePlansRoute = express.Router();

const updateInvoiceInsurancePlansSchema = z
  .object({
    invoiceInsurancePlanIds: z.array(z.string()).default([]),
  })
  .strip();

insurancePlansRoute.put(
  '/:id/insurancePlans',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Invoice');

    const invoiceId = req.params.id;

    const invoice = await req.models.Invoice.findByPk(invoiceId, { attributes: ['id', 'status'] });
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== INVOICE_STATUSES.IN_PROGRESS) {
      throw new InvalidOperationError('Only in progress invoices can be updated');
    }

    const { data, error } = await updateInvoiceInsurancePlansSchema.safeParseAsync(req.body);
    if (error) {
      throw new ValidationError(error.message);
    }

    const { invoiceInsurancePlanIds } = data;
    const transaction = await req.db.transaction();

    try {
      // Remove links not in provided list (or all if list empty)
      await req.models.InvoicesInvoiceInsurancePlan.destroy(
        invoiceInsurancePlanIds.length
          ? {
              where: { invoiceId, invoiceInsurancePlanId: { [Op.notIn]: invoiceInsurancePlanIds } },
            }
          : { where: { invoiceId } },
        { transaction },
      );

      // Find existing links to avoid duplicates
      const existing = await req.models.InvoicesInvoiceInsurancePlan.findAll({
        where: { invoiceId },
        attributes: ['invoiceInsurancePlanId'],
        transaction,
      });
      const existingIds = new Set(existing.map(r => r.invoiceInsurancePlanId));

      const toCreate = invoiceInsurancePlanIds.filter(id => !existingIds.has(id));

      if (toCreate.length) {
        await req.models.InvoicesInvoiceInsurancePlan.bulkCreate(
          toCreate.map(planId => ({ id: uuidv4(), invoiceId, invoiceInsurancePlanId: planId })),
          { transaction },
        );
      }

      await transaction.commit();

      // Return the current set of linked plans
      const linked = await req.models.InvoicesInvoiceInsurancePlan.findAll({
        where: { invoiceId },
        include: [{ model: req.models.InvoiceInsurancePlan, as: 'invoiceInsurancePlan' }],
      });
      res.json({ count: linked.length, data: linked });
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }),
);
