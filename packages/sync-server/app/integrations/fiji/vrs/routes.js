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

    // TODO (TAN-951): validate expectAccessToken against auth header

    // validate request
    const { fetch_id: fetchId } = await schema.remoteRequest.patientCreated.validate(body, {
      stripUnknown: true,
    });

    // fetch patient
    const { patient, patientAdditionalData, patientVRSData } = await vrsRemote.getPatientByFetchId(
      fetchId,
    );

    // persist
    // TODO (TAN-950): DELETE support
    await sequelize.transaction(async () => {
      // allow inserts and updates to resurrect deleted records
      const [{ id: upsertedPatientId }] = await Patient.upsert(
        { ...patient, deletedAt: null },
        { returning: true, paranoid: false },
      );
      patientAdditionalData.patientId = upsertedPatientId;
      patientVRSData.patientId = upsertedPatientId;
      await PatientAdditionalData.upsert(patientAdditionalData);
      await PatientVRSData.upsert(patientVRSData);
    });

    // acknowledge request
    await vrsRemote.acknowledge(fetchId);

    res.send({ response: false });

    // TODO: custom error handling
    // TODO: in existing middleware, check whether an error code is already sent, as per express docs
    //res.status(400).send({ success: false, response: false, error: 'TODO' });
  }),
);

// empty router, to make it easier to move routes from private to public
export const vrsRoutes = express.Router();
