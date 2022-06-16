import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

export const patientSecondaryIdRoutes = express.Router();

patientSecondaryIdRoutes.get(
  '/:id/secondaryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'Patient');

    const { rows, count } = await models.PatientSecondaryId.findAndCountAll({
      where: { patientId: params.id },
    });

    res.send({
      count,
      data: rows,
    });
  }),
);

patientSecondaryIdRoutes.put(
  '/:id/secondaryId/:secondaryIdId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'PatientSecondaryId');
    const secondaryId = await models.PatientSecondaryId.findByPk(params.secondaryIdId);
    if (!secondaryId) throw new NotFoundError();
    req.checkPermission('write', secondaryId);
    await secondaryId.update(req.body);
    res.send(secondaryId);
  }),
);

patientSecondaryIdRoutes.post(
  '/:id/secondaryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'Patient');

    const patient = await models.Patient.findByPk(params.id);
    if (!patient) {
      throw new NotFoundError();
    }

    const secondaryId = await models.PatientSecondaryId.create({
      value: req.body.value,
      visibilityStatus: req.body.visibilityStatus,
      typeId: req.body.typeId,
      patientId: params.id,
    });

    res.send(secondaryId);
  }),
);
