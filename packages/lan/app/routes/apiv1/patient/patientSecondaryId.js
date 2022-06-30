import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from 'shared/errors';

export const patientSecondaryIdRoutes = express.Router();

patientSecondaryIdRoutes.get(
  '/:id/secondaryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const patient = await models.Patient.findByPk(params.id);
    if (!patient) throw new NotFoundError();
    req.checkPermission('read', patient);

    const { rows, count } = await models.PatientSecondaryId.findAndCountAll({
      where: { patientId: params.id },
    });

    // Check read permissions on every patient secondary ID
    rows.forEach(secondaryId => {
      req.checkPermission('read', secondaryId);
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
    const secondaryId = await models.PatientSecondaryId.findByPk(params.secondaryIdId);
    if (!secondaryId) throw new NotFoundError();
    req.checkPermission('read', secondaryId);
    req.checkPermission('write', secondaryId);

    await secondaryId.update(req.body);
    res.send(secondaryId);
  }),
);

patientSecondaryIdRoutes.post(
  '/:id/secondaryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const patient = await models.Patient.findByPk(params.id);
    if (!patient) throw new NotFoundError();
    req.checkPermission('read', patient);
    req.checkPermission('create', 'PatientSecondaryId');

    const secondaryId = await models.PatientSecondaryId.create({
      value: req.body.value,
      visibilityStatus: req.body.visibilityStatus,
      typeId: req.body.typeId,
      patientId: params.id,
    });

    res.send(secondaryId);
  }),
);
