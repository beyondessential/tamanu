import express from 'express';
import asyncHandler from 'express-async-handler';
import { makeCertificate } from '../utils/certificates';

export const testPdf = express.Router();

testPdf.get(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const { params } = req;
    const { patientId } = params;
    const { models } = req.store;

    const patient = await models.Patient.findByPk(patientId);
    const labs = await patient.getLabRequests();
    const data = {
      ...patient.dataValues,
      labs,
    };

    await makeCertificate(data);
    res.send({});
  }),
);
