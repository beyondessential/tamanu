import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';

import * as schema from './schema';
import { VRSRemote } from './VRSRemote';

export const vrsRoutes = express.Router();

// TODO: test coverage
// TODO: find or build sandbox

const matchRole = () => {
  throw new Error('TODO: copy the RBAC implementation from lan, or something');
};

vrsRoutes.post(
  '/hooks/patientCreated',
  asyncHandler(async (req, res) => {
    try {
      const { body, store } = req;
      const { sequelize, models } = store;
      const { Patient, PatientAdditionalData } = models;

      // TODO: wire this up to the store in middleware (probably going to be a fairly involved process)
      const remote = new VRSRemote(store, config.integrations.fiji.vrs);

      // validation
      await matchRole('create', store.models.Patient); // TODO: RBAC on sync
      const { fetch_id: displayId } = await schema.remoteRequest.patientCreated.validate(body);

      // fetch patient
      const { patient, patientAdditionalData } = await remote.getPatient(displayId);

      // assign uuid
      patient.id = uuidv4();
      patientAdditionalData.patientId = patient.id;

      // TODO: further validation required?

      // persist
      await sequelize.transaction(async () => {
        await Patient.create(patient);
        await PatientAdditionalData.create(patientAdditionalData);
      });

      res.send({ todo: true, success: true });
    } catch (e) {
      // TODO: custom error handling?
      res.status(400).send({ todo: true, success: false });
    }
  }),
);
