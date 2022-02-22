import util from 'util';

import { log } from 'shared/services/logging';
import { RemoteCallFailedError, InvalidOperationError } from 'shared/errors';

import * as schema from './schema';

export class VRSActionHandler {
  store = null;

  remote = null;

  constructor(store, remote, { flagInsteadOfDeleting, retryMinAgeMs }) {
    this.store = store;
    this.remote = remote;
    this.flagInsteadOfDeleting = flagInsteadOfDeleting;
    this.retryMinAgeMs = retryMinAgeMs;
  }

  async retryPendingActions() {
    const actions = await this.remote.getAllPendingActions();

    if (actions.length === 0) {
      return; // quit early and don't log anything
    }
    log.info(`VRSActionHandler: Retrying ${actions.length} actions`);

    // retry one action at a time
    let successCount = 0;
    for (const action of actions) {
      try {
        const isRecent = action.created_datetime.getTime() + this.retryMinAgeMs > Date.now();
        if (isRecent) {
          log.debug(`VRSActionHandler: Skipping recent action (action=${JSON.stringify(action)})`);
        } else {
          log.debug(`VRSActionHandler: Retrying action (action=${JSON.stringify(action)})`);
          await this.applyAction(action);
        }
        successCount++;
      } catch (e) {
        log.error('VRSActionHandler: Recieved error while applying action:');
        log.error(e);
      }
    }

    log.info(`VRSActionHandler: Successfully retried ${successCount}/${actions.length} actions`);
  }

  async applyAction(action) {
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
