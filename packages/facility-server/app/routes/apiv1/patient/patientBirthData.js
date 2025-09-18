import express from 'express';
import asyncHandler from 'express-async-handler';

export const patientBirthData = express.Router();

patientBirthData.get(
  '/:id/birthData',
  asyncHandler(async (req, res) => {
    const {
      models,
      params,
      query: { facilityId },
    } = req;

    req.checkPermission('read', 'Patient');

    const birthDataRecord = await models.PatientBirthData.findOne({
      where: { patientId: params.id },
    });

    const recordData = birthDataRecord ? birthDataRecord.toJSON() : {};

    if (birthDataRecord) {
      await req.audit.access({
        recordId: birthDataRecord.id,
        frontEndContext: params,
        model: models.PatientBirthData,
        facilityId,
      });
    }

    res.send({ ...recordData });
  }),
);
