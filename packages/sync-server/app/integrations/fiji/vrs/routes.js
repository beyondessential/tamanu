import express from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';

import * as schema from './schema';

export const publicVrsRoutes = express.Router();

publicVrsRoutes.post(
  '/hooks/patientCreated',
  asyncHandler(async (req, res) => {
    const { body, store, ctx } = req;
    const { vrsRemote } = ctx.integrations.fiji;
    const { sequelize, models } = store;
    const { Patient, PatientAdditionalData, PatientVRSData } = models;

    // TODO: validate expectAccessToken against auth header

    // validate request
    const { fetch_id: fetchId } = await schema.remoteRequest.patientCreated.validate(body);

    // fetch patient
    const { patient, patientAdditionalData, patientVRSData } = await vrsRemote.getPatientByFetchId(
      fetchId,
    );

    // assign uuid
    patient.id = uuidv4();
    patientAdditionalData.patientId = patient.id;
    patientVRSData.patientId = patient.id;

    // persist
    // TODO: determine the difference between UPDATE and INSERT - can we do an idempotent upsert?
    // TODO: DELETE support
    // TODO: add an origin='vrs' field to records to track where they came from
    await sequelize.transaction(async () => {
      await Patient.create(patient);
      await PatientAdditionalData.create(patientAdditionalData);
      await PatientVRSData.create(patientVRSData);
    });

    // acknowledge request
    // TODO: do we need to persist and retry acks? or will the system handle it?
    await vrsRemote.acknowledge(fetchId);

    res.send({ response: false });

    // TODO: custom error handling
    // TODO: in existing middleware, check whether an error code is already sent, as per express docs
    //res.status(400).send({ success: false, response: false, error: 'TODO' });
  }),
);

// empty router, to make it easier to move routes from private to public
export const vrsRoutes = express.Router();
