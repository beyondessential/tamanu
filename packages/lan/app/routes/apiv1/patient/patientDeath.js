import express from 'express';
import asyncHandler from 'express-async-handler';
import { InvalidOperationError, NotFoundError } from 'shared/errors';
import * as yup from 'yup';

export const patientDeath = express.Router();

patientDeath.post(
  '/:id/death',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Patient');

    const {
      models: { Patient },
      params: { id: patientId },
    } = req;

    const schema = yup.object().shape({
      date: yup.date().required(),
    });
    const body = await schema.validate(req.body);

    const patient = await Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    if (patient.dateOfDeath) throw new InvalidOperationError('Patient is already deceased');

    await patient.update({ dateOfDeath: body.date });

    res.send({
      data: {},
    });
  }),
);
