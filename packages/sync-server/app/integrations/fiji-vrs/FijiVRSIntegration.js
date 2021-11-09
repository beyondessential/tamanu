import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import util from 'util';
import { set } from 'lodash';

import { log } from 'shared/services/logging';
import { Integration } from '../Integration';

import * as schema from './schema';
import { VRSRemote } from './VRSRemote';

export class FijiVRSIntegration extends Integration {
  static publicRoutes() {
    const publicRoutes = express.Router();
    publicRoutes.post(
      '/hooks/patientCreated',
      asyncHandler(async (req, res) => {
        const { body, store, ctx } = req;
        const { remote } = ctx.integrations.fijiVrs;

        const { sequelize, models } = store;
        const { Patient, PatientAdditionalData, PatientVRSData } = models;

        // TODO (TAN-951): validate expectAccessToken against auth header

        // validate request
        const { fetch_id: fetchId } = await schema.remoteRequest.patientCreated.validate(body, {
          stripUnknown: true,
        });

        // fetch patient
        const { patient, patientAdditionalData, patientVRSData } = await remote.getPatientByFetchId(
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
    return publicRoutes;
  }

  static async initContext(ctx) {
    const remote = new VRSRemote(ctx.store, config.integrations.fijiVrs);
    set(ctx, 'integrations.fijiVrs.remote', remote);
  }
}
