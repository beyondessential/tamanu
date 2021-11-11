import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import util from 'util';
import { set } from 'lodash';

import { log } from 'shared/services/logging';

import * as schema from './schema';
import { VRSRemote } from './VRSRemote';

export const routes = express.Router();
routes.post(
  '/hooks/patientCreated',
  asyncHandler(async (req, res) => {
    const { body, store, ctx } = req;
    const { remote } = ctx.integrations.fijiVrs;

    const { sequelize, models } = store;
    const { Patient, PatientAdditionalData, PatientVRSData } = models;

    // TODO (TAN-951): validate expectAccessToken against auth header

    // validate request
    const {
      operation,
      fetch_id: fetchId,
    } = await schema.remoteRequest.patientCreated.validate(body, { stripUnknown: true });

    // fetch patient
    const { patient, patientAdditionalData, patientVRSData } = await remote.getPatientByFetchId(
      fetchId,
    );

    // persist
    if (operation === schema.OPERATIONS.DELETE) {
      await Patient.update(
        { deletedAt: new Date() },
        {
          where: { displayId: patient.displayId },
        },
      );
    } else if ([schema.OPERATIONS.INSERT, schema.OPERATIONS.UPDATE].includes(operation)) {
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
    } else {
      throw new Error(`vrs: Operation not supported: ${operation}`);
    }

    // acknowledge request
    try {
      await remote.acknowledge(fetchId);
    } catch (e) {
      log.error(
        `vrs: Patient import succeded, but received an error while acknowledging: (displayId=${
          patient.displayId
        }, error=${util.inspect(e)}`,
      );
    }

    // TODO (TAN-952): custom error handling that sets response to false
    // TODO: in existing middleware, check whether an error code is already sent, as per express docs

    res.send({ response: true });
  }),
);

export const initAppContext = async ctx => {
  const remote = new VRSRemote(ctx.store, config.integrations.fijiVrs);
  set(ctx, 'integrations.fijiVrs.remote', remote);
};
