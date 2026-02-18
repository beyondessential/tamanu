import express from 'express';
import asyncHandler from 'express-async-handler';
import { INVOICE_STATUSES } from '@tamanu/constants';

export const patientInsurancePlans = express.Router();

patientInsurancePlans.get(
  '/:id/insurancePlans',
  asyncHandler(async (req, res) => {
    const {
      models,
      params,
    } = req;

    req.checkPermission('read', 'Patient');

    const insurancePlans = await models.PatientInvoiceInsurancePlan.findAll({
      where: { patientId: params.id },
    });

    res.send(insurancePlans);
  }),
);

patientInsurancePlans.get(
  '/:id/insurancePlans/inUse',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    req.checkPermission('read', 'Patient');

    const inUsePlans = await models.InvoiceInsurancePlan.findAll({
      include: [{
        model: models.Invoice,
        as: 'relatedInvoices',
        attributes: [],
        required: true,
        where: { status: INVOICE_STATUSES.IN_PROGRESS },
        include: [{
          model: models.Encounter,
          as: 'encounter',
          attributes: [],
          required: true,
          where: { patientId: params.id },
        }],
      }],
    });

    const plans = inUsePlans.map(plan => ({
      invoiceInsurancePlanId: plan.id,
      name: plan.name || plan.id,
    }));

    res.send(plans);
  }),
);
