import mitt from 'mitt';
import { Database } from '~/infra/db';

import { readConfig, writeConfig } from '~/services/config';
import { SyncRecord, SyncPage, SyncSource } from './syncSource';

class NoSyncImporterError extends Error {
  constructor(recordType) {
    super(`No sync importer for record type ${recordType}`);
  }
}

export class SyncManager {

  isSyncing = false; 
  emitter = mitt();

  constructor(syncSource: SyncSource) {
    this.syncSource = syncSource;

    this.emitter.on("*", (action, ...args) => {
      console.log(`[sync] ${action} ${args[0] || ''}`);
    });
  }

  getModelForRecordType(recordType: string) {
    const { models } = Database;

    switch(recordType) {
      case "patient":
        return models.Patient;
      case "program":
        return models.Program;
      case "referenceData":
        return models.ReferenceData;
      default:
        return null;
    }
  }

  async syncRecord(syncRecord: SyncRecord) {
    // write one single downloaded record to the database
    const { recordType, data } = syncRecord;
    const model = this.getModelForRecordType(recordType);
    if(!model) {
      throw new NoSyncImporterError(recordType);
    }

    await model.createOrUpdate(data);
      
    this.emitter.emit("syncedRecord", syncRecord.recordType, syncRecord);
  }

  async runScheduledSync() {
    // query the server for any new data
    // - how do we know whether data is new?
    //   - send most recent sync date
    // - how do we know which data we want?
    //   - send IDs of patients we're interested in?
    //     - does this mean sending over hundreds of patient IDs in the request?
    //     - or making hundreds of requests (1/patient)
    //     - how does this work w/ LAN sync? 1000s of requests??
    //     - does the sync server track which patients which clients want?
    // - does initial sync work differently?
    //   - sync reference data
    //   - get all provisional patients
    
    if(this.isSyncing) {
      console.warn("Tried to start syncing while sync in progress");
      return;
    }
    this.isSyncing = true;

    this.emitter.emit("syncStarted");

    await this.runReferenceSync();

    // sync all reference data including shallow patient list
    // full sync of patients that've been flagged (encounters, etc)
    /*
    const patientsToSync = await this.getPatientsToSync();
    this.emitter.emit("patientSyncStarted", patientsToSync.length);
    for(let i = 0; i < patientsToSync.length; i++) {
      try {
        const patient = patientsToSync[i];
        await this.runPatientSync(patient);
        this.emitter("patientRecordSynced", patient, i, patientsToSync.length);
      } catch(e) {
        console.warn(e.message);
      }
    }
    this.emitter.emit("patientSyncEnded");
    */

    this.emitter.emit("syncEnded");
    this.isSyncing = false;
  }

  getPatientsToSync() {
    const { models } = Database;
    return models.Patient.find({
      markedForSync: true, 
    });
  }

  async markPatientForSync(patient: Patient) {
    patient.markedForSync = true;
    await patient.save();

    // TODO: this has room to be a bit more intelligent
    this.runScheduledSync();
  }

  async syncAllPages(channel: string, since: Date, syncCallback: SyncCallback) {
    let page = 0;

    let maxDate = since;
    try {
      do {
        this.emitter.emit("syncingPage", `${channel}-${page}`);
        const {
          records,
          nextPage 
        } = await this.syncSource.getSyncData(channel, since, page);

        await Promise.all(records.map(async r => {
          if(r.lastSynced > maxDate) {
            maxDate = r.lastSynced;
          }
          await this.syncRecord(r)
        }));

        page = nextPage;
      } while(page > 0);
    } catch(e) {
      console.warn(e);
    }

    return maxDate;
  }

  async runPatientSync(patient: Patient) {
    await this.syncAllPages(`patient/${patient.id}`, patient.lastSynced);

    patient.lastSynced = new Date();
    await patient.save();
  }

  async getReferenceSyncDate(): Promise<Date> {
    const timestampString = await readConfig('referenceSyncDate', '0');
    const timestamp = parseInt(timestampString, 10);
    return new Date(timestamp);
  }

  async updateReferenceSyncDate(date: Date): Promise<void> {
    const timestampString = `${date.valueOf()}`;
    await writeConfig('referenceSyncDate', timestampString);
  }

  async runReferenceSync() {
    const lastSynced = await this.getReferenceSyncDate();

    this.emitter.emit("referenceSyncStarted");
    const maxDate = await this.syncAllPages(`reference`, lastSynced);
    this.emitter.emit("referenceSyncEnded");

    await this.updateReferenceSyncDate(maxDate);
  }

}

