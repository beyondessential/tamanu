import express from 'express';
import asyncHandler from 'express-async-handler';

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
