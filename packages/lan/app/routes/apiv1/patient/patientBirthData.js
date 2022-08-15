import express from 'express';
import asyncHandler from 'express-async-handler';

export const patientBirthData = express.Router();

patientBirthData.get(
  '/:id/birthData',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    req.checkPermission('read', 'Patient');

    const birthDataRecord = await models.PatientBirthData.findOne({
      where: { patientId: params.id },
    });

    const recordData = birthDataRecord ? birthDataRecord.toJSON() : {};

    res.send({ ...recordData });
  }),
);
