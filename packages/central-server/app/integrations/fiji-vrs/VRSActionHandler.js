import util from 'util';

import { log } from '@tamanu/shared/services/logging';
import { InvalidOperationError, RemoteCallError } from '@tamanu/errors';
import { stringToStableInteger } from '@tamanu/shared/utils';

import * as schema from './schema';

const BASE_VRS_PATIENT_UPSERT_ADVISORY_KEY = 'vrsPatientUpsertAdvisoryLock';

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
    let skipCount = 0;
    let failCount = 0;
    for (const action of actions) {
      try {
        const { CreatedDateTime, Operation, Id } = action;
        const isRecent = CreatedDateTime.getTime() + this.retryMinAgeMs > Date.now();
        if (isRecent) {
          log.debug(`VRSActionHandler: Skipping recent action (action=${JSON.stringify(action)})`);
          skipCount++;
        } else {
          log.debug(`VRSActionHandler: Retrying action (action=${JSON.stringify(action)})`);
          await this.applyAction({
            created_datetime: CreatedDateTime,
            operation: Operation,
            fetch_id: Id,
          });
          successCount++;
        }
      } catch (e) {
        log.error('VRSActionHandler: Received error while applying action', {
          fetchId: action?.Id,
        });
        log.error(e);
        failCount++;
      }
    }

    log.info(
      `VRSActionHandler: Finished (${actions.length} total, ${successCount} successful, ${skipCount} skipped, ${failCount} failed)`,
    );
  }

  async applyAction(action) {
    const { sequelize, models } = this.store;
    const { Patient, PatientAdditionalData, PatientVRSData } = models;

    // validate action
    const {
      operation,
      fetch_id: fetchId,
    } = await schema.remoteRequest.patientCreated.validate(action, { stripUnknown: true });
    log.debug(`VRSActionHandler: applying action (operation=${operation}, fetch_id=${fetchId})`);

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
        // Not a plain upsert() because patients_display_id_key is DEFERRABLE (see
        // TAM-7004), and Postgres forbids deferrable constraints as ON CONFLICT
        // arbiters. Guarded by an advisory lock (same pattern as
        // Invoice.addItemToInvoice) since this find-then-write would otherwise race
        // against a concurrent call for the same displayId -- applyAction is invoked
        // both from the retry poller and the real-time webhook route, so the same
        // patient could genuinely be processed by both around the same time.
        const lockId = stringToStableInteger(
          `${BASE_VRS_PATIENT_UPSERT_ADVISORY_KEY}:${patient.displayId}`,
        );
        await sequelize.query(`SELECT pg_advisory_xact_lock(:lockId)`, {
          replacements: { lockId },
        });

        const existingPatient = await Patient.findOne({
          where: { displayId: patient.displayId },
          paranoid: false,
        });

        let upsertedPatientId;
        if (existingPatient) {
          if (existingPatient.deletedAt) {
            await existingPatient.restore(); // allow inserts and updates to resurrect deleted records - real deletion path
          }
          await existingPatient.update(patient);
          upsertedPatientId = existingPatient.id;
        } else {
          const createdPatient = await Patient.create(patient);
          upsertedPatientId = createdPatient.id;
        }

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
      throw new RemoteCallError(
        'vrs: Patient import succeeded, but received an error while acknowledging',
      ).withExtraData({
        displayId: patient.displayId,
        error: util.inspect(e),
      });
    }
  }
}
