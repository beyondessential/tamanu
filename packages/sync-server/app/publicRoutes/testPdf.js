// Todo: Remove before merging vds-epic
import express from 'express';
import asyncHandler from 'express-async-handler';
import { makePatientCovidCertificate } from '../utils/patientCertificates';

export const testPdf = express.Router();

testPdf.get(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const { params } = req;
    const { patientId } = params;
    const { models } = req.store;

    const patient = await models.Patient.findByPk(patientId);

    await makePatientCovidCertificate(patient, models);
    res.send({});
  }),
);
