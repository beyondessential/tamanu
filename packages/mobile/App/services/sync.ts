import mitt from 'mitt';
import { Database } from '~/infra/db';

import { dummyReferenceRecords } from '~/dummyData/referenceData';
import { readConfig, writeConfig } from '~/services/config';

interface SyncRecordData {
  lastModified: Date;
  [key: string]: any;
}

interface SyncRecord {
  recordType: string;
  data: SyncRecordData;
}

interface SyncSource {
  getReferenceData(since: Date): Promise<SyncRecord[]>;
  getPatientData(patientId: string, since: Date): Promise<SyncRecord[]>;
}

//----------------------------------------------------------
// TODO: remove & replace with real functionality

export class DummySyncSource implements SyncSource {

  async getReferenceData(since: Date): Promise<SyncRecord[]> {
    const records = dummyReferenceRecords
      .filter(x => x.data.lastModified > since)
      // .slice(0, 4);
    // simulate a download delay
    await new Promise((resolve) => setTimeout(resolve, 1 * records.length));
    return records;
  }

  async getPatientData(patientId: string, since: Date): Promise<SyncRecord[]> {
    return [];
  }
}
//----------------------------------------------------------

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
      console.log(`[sync] ${action}`);
    });
  }

  getModelForRecordType(recordType: string) {
    const { models } = Database;

    switch(recordType) {
      case "patient":
        return models.Patient;
      case "scheduledVaccine":
        return models.ScheduledVaccine;
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

    const createdRecord = await model.createOrUpdate(data);
    console.log(syncRecord.recordType, createdRecord);
    this.emitter.emit("syncedRecord", syncRecord);
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

    const since = await this.getReferenceSyncDate();

    this.emitter.emit("referenceDownloadStarted");
    const referenceRecords = await this.syncSource.getReferenceData(since);
    this.emitter.emit("referenceDownloadEnded");

    // sync all reference data including shallow patient list
    let maxDate = since;
    this.emitter.emit("referenceSyncStarted", referenceRecords.length);
    await Promise.all(referenceRecords.map(async (r, i) => {
      try {
        await this.syncRecord(r);
        this.emitter.emit("referenceRecordSynced", r, i, referenceRecords.length);
        if(r.data.lastModified > maxDate) {
          maxDate = r.data.lastModified;
        }
      } catch(e) {
        console.warn(e.message);
      }
    }));
    this.emitter.emit("referenceSyncEnded");

    await this.updateReferenceSyncDate(maxDate);

    // full sync of patients that've been flagged (encounters, etc)
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

    this.emitter.emit("syncEnded");
    this.isSyncing = false;
  }

  async getReferenceSyncDate(): Date {
    const timestampString = await readConfig('referenceSyncDate', '0');
    const timestamp = parseInt(timestampString, 10);
    return new Date(timestamp);
  }

  async updateReferenceSyncDate(date: Date): void {
    const timestampString = `${date.valueOf()}`;
    await writeConfig('referenceSyncDate', timestampString);
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

  async runPatientSync(patient: Patient) {
    const patientRecords = await this.syncSource.getPatientData(patient.id, patient.lastSynced);
    await Promise.all(patientRecords.map(r => this.syncRecord(r)));

    patient.lastSynced = new Date();
    await patient.save();
  }

}

