import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { Op } from 'sequelize';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { NotFoundError, InvalidOperationError, ValidationError } from '@tamanu/errors';

export const insurancePlansRoute = express.Router();

const updateInvoiceInsurancePlansSchema = z
  .object({
    invoiceInsurancePlanIds: z.array(z.string()).default([]),
    // Not .uuid(): provisioned section ids are codes such as 'invoiceSection-emergency'.
    // min(1) keeps an empty string from reaching the foreign key as a value.
    invoiceSectionId: z.string().min(1).nullish(),
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
    // A section header's own Insurance plan action names its section; an invoice showing no
    // headers names none, and its attachments cover the whole invoice.
    const invoiceSectionId = data.invoiceSectionId ?? null;

    if (invoiceSectionId) {
      const configuredSections = await req.models.Invoice.listConfiguredInvoiceSections();
      if (!configuredSections.some(section => section.id === invoiceSectionId)) {
        throw new ValidationError(
          `Invoice section ${invoiceSectionId} is not a current invoice section`,
        );
      }
    }

    // Managed transaction: CLS binds it to every Sequelize call inside the callback, so the
    // reconcile below rolls back as a whole.
    await req.db.transaction(async () => {
      // Scoped to the named section, so attaching a plan to one section leaves the plans on the
      // other sections where they are.
      const scope = { invoiceId, invoiceSectionId };

      await req.models.InvoicesInvoiceInsurancePlan.destroy({
        where: invoiceInsurancePlanIds.length
          ? { ...scope, invoiceInsurancePlanId: { [Op.notIn]: invoiceInsurancePlanIds } }
          : scope,
      });

      const attachments = await req.models.InvoicesInvoiceInsurancePlan.findAll({
        where: { invoiceId },
        attributes: ['invoiceInsurancePlanId', 'invoiceSectionId'],
        raw: true,
      });

      // A plan covering the whole invoice already covers every section's items, so holding both
      // would count its coverage twice.
      const conflicting = attachments.find(
        attachment =>
          Boolean(attachment.invoiceSectionId) !== Boolean(invoiceSectionId) &&
          invoiceInsurancePlanIds.includes(attachment.invoiceInsurancePlanId),
      );
      if (conflicting) {
        throw new ValidationError(
          invoiceSectionId
            ? `Insurance plan ${conflicting.invoiceInsurancePlanId} already covers the whole invoice`
            : `Insurance plan ${conflicting.invoiceInsurancePlanId} is already attached to a section of this invoice`,
        );
      }

      const attachedToScope = new Set(
        attachments
          .filter(attachment => (attachment.invoiceSectionId ?? null) === invoiceSectionId)
          .map(attachment => attachment.invoiceInsurancePlanId),
      );
      const toCreate = invoiceInsurancePlanIds.filter(planId => !attachedToScope.has(planId));

      if (toCreate.length) {
        await req.models.InvoicesInvoiceInsurancePlan.bulkCreate(
          toCreate.map(planId => ({
            id: crypto.randomUUID(),
            invoiceId,
            invoiceInsurancePlanId: planId,
            invoiceSectionId,
          })),
        );
      }
    });

    // Return every linked plan, not just the named section's, so a caller showing the whole
    // invoice does not have to refetch the sections it did not touch.
    const linked = await req.models.InvoicesInvoiceInsurancePlan.findAll({
      where: { invoiceId },
      include: [{ model: req.models.InvoiceInsurancePlan, as: 'invoiceInsurancePlan' }],
    });
    res.json({ count: linked.length, data: linked });
  }),
);
