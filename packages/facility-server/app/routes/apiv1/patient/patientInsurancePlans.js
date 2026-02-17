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

    const inUsePlans = await models.InvoicesInvoiceInsurancePlan.findAll({
      attributes: ['invoiceInsurancePlanId'],
      include: [
        {
          model: models.Invoice,
          as: 'invoice',
          attributes: [],
          where: { status: INVOICE_STATUSES.IN_PROGRESS },
          required: true,
          include: [
            {
              model: models.Encounter,
              as: 'encounter',
              attributes: [],
              where: { patientId: params.id },
              required: true,
            },
          ],
        },
        {
          model: models.InvoiceInsurancePlan,
          as: 'invoiceInsurancePlan',
          attributes: ['id', 'name'],
        },
      ],
    });

    const uniquePlans = new Map();
    for (const plan of inUsePlans) {
      if (!uniquePlans.has(plan.invoiceInsurancePlanId)) {
        uniquePlans.set(plan.invoiceInsurancePlanId, {
          invoiceInsurancePlanId: plan.invoiceInsurancePlanId,
          name: plan.invoiceInsurancePlan?.name || plan.invoiceInsurancePlanId,
        });
      }
    }

    res.send([...uniquePlans.values()]);
  }),
);
