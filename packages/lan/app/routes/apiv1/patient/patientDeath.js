import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

export const patientDeath = express.Router();

patientDeath.put(
  '/:id/death',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Patient');

    const { body, models: { Patient }, params: { id: patientId } } = req;

    const patient = await Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    await patient.update({ dateOfDeath: body.date });

    res.send({
      data: {},
    });
  }),
);