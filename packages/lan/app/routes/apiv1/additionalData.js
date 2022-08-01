import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'shared/errors';

export const additionalData = express.Router();

/*
  PatientAdditionalData is just a backend distinction
  with Patient, so the permission check should just
  be against Patient.

  pad = PatientAdditionalData
*/
additionalData.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientAdditionalData },
      params,
    } = req;
    req.checkPermission('read', 'Patient');
    const pad = await PatientAdditionalData.findByPk(params.id, {
      include: PatientAdditionalData.getFullReferenceAssociations(),
    });
    if (!pad) throw new NotFoundError();
    res.send(pad);
  }),
);

additionalData.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientAdditionalData },
      params,
    } = req;
    req.checkPermission('write', 'Patient');
    const pad = await PatientAdditionalData.findByPk(params.id);
    if (!pad) throw new NotFoundError();
    await pad.update(req.body);
    res.send(pad);
  }),
);

additionalData.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientAdditionalData },
    } = req;
    req.checkPermission('create', 'Patient');
    const pad = await PatientAdditionalData.create(req.body);
    res.send(pad);
  }),
);
