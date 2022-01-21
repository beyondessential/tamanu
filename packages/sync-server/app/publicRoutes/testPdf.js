import express from 'express';
import asyncHandler from 'express-async-handler';
import { makeCertificate } from '../utils/certificates';

export const testPdf = express.Router();

testPdf.get(
  '/:patientId',
  asyncHandler(async (req, res) => {
    console.log('test...');
    const { params } = req;
    const { patientId } = params;
    const { models } = req.store;

    const patient = await models.Patient.findByPk(patientId);
    const { dataValues } = patient;

    console.log('data', dataValues);
    await makeCertificate(dataValues);
    res.send({});
  }),
);
