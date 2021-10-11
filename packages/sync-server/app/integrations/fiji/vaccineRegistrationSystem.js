import express from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';

import * as schema from './schema';

export const publicVrsRoutes = express.Router();

// TODO: test coverage
// TODO: find or build sandbox

const matchRole = () => {
  throw new Error('TODO: copy the RBAC implementation from lan, or something');
};

publicVrsRoutes.post(
  '/hooks/patientCreated',
  asyncHandler(async (req, res) => {
    // TODO: how do they handle auth with our system?

    const { body, store, ctx } = req;
    const { vrsRemote } = ctx.integrations.fiji;
    const { sequelize, models } = store;
    const { Patient, PatientAdditionalData } = models;

    // validation
    // TODO: RBAC on sync? is this route authenticated?
    // await matchRole('create', store.models.Patient);
    const { fetch_id: fetchId } = await schema.remoteRequest.patientCreated.validate(body);

    // fetch patient
    const { patient, patientAdditionalData } = await vrsRemote.getPatientByFetchId(fetchId);

    // assign uuid
    patient.id = uuidv4();
    patientAdditionalData.patientId = patient.id;

    // TODO: further validation required?

    // persist
    // TODO: upsert?
    await sequelize.transaction(async () => {
      await Patient.create(patient);
      await PatientAdditionalData.create(patientAdditionalData);
    });

    // TODO: ack
    // TODO: do we need to persist and retry acks? or will the system handle it?
    // await vrsRemote.acknowledge(displayId);

    res.send({ response: true });
    // TODO: custom error handling?
    //res.status(400).send({ success: false, response: false, error: 'TODO' });
  }),
);

// empty router, to make it easier to move routes from private to public
export const vrsRoutes = express.Router();
