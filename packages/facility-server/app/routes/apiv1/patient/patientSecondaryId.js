import express from 'express';
import asyncHandler from 'express-async-handler';
import { pick } from 'lodash';
import { NotFoundError } from '@tamanu/errors';

export const patientSecondaryIdRoutes = express.Router();

patientSecondaryIdRoutes.get(
  '/:id/secondaryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
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
    req.checkPermission('write', secondaryId);

    const updatableFields = pick(req.body, ['value', 'visibilityStatus', 'typeId']);
    await secondaryId.update(updatableFields);
    res.send(secondaryId);
  }),
);

patientSecondaryIdRoutes.post(
  '/:id/secondaryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const patient = await models.Patient.findByPk(params.id);
    if (!patient) throw new NotFoundError();
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
