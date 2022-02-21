import util from 'util';

import { RemoteCallFailedError, InvalidOperationError } from 'shared/errors';

import * as schema from './schema';

export class VRSActionHandler {
  store = null;

  remote = null;

  constructor(store, remote, { flagInsteadOfDeleting }) {
    this.store = store;
    this.remote = remote;
    this.flagInsteadOfDeleting = flagInsteadOfDeleting;
  }

  async handleAction(action) {
    const { sequelize, models } = this.store;
    const { Patient, PatientAdditionalData, PatientVRSData } = models;

    // validate action
    const {
      operation,
      fetch_id: fetchId,
    } = await schema.remoteRequest.patientCreated.validate(action, { stripUnknown: true });

    // fetch patient
    const {
      patient,
      patientAdditionalData,
      patientVRSData,
    } = await this.remote.getPatientByFetchId(fetchId);

    // persist
    if (operation === schema.OPERATIONS.DELETE) {
      if (this.flagInsteadOfDeleting) {
        const { id: patientId } = await Patient.findOne({
          where: { displayId: patient.displayId },
        });
        await PatientVRSData.upsert({ patientId, isDeletedByRemote: true });
      } else {
        await Patient.update(
          { deletedAt: new Date() },
          {
            where: { displayId: patient.displayId },
          },
        );
      }
    } else if ([schema.OPERATIONS.INSERT, schema.OPERATIONS.UPDATE].includes(operation)) {
      await sequelize.transaction(async () => {
        // allow inserts and updates to resurrect deleted records - real deletion path
        const [{ id: upsertedPatientId }] = await Patient.upsert(
          { ...patient, deletedAt: null },
          { returning: true, paranoid: false },
        );
        patientAdditionalData.patientId = upsertedPatientId;
        patientVRSData.patientId = upsertedPatientId;
        await PatientAdditionalData.upsert(patientAdditionalData);
        // allow inserts and updates to resurrect deleted records - data flag path
        await PatientVRSData.upsert({ ...patientVRSData, isDeletedByRemote: false });
      });
    } else {
      throw new InvalidOperationError(`vrs: Operation not supported: ${operation}`);
    }

    // acknowledge request
    try {
      await this.remote.acknowledge(fetchId);
    } catch (e) {
      throw new RemoteCallFailedError(
        `vrs: Patient import succeded, but received an error while acknowledging: (displayId=${
          patient.displayId
        }, error=${util.inspect(e)}`,
      );
    }
  }
}
