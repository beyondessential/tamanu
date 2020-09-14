import mitt from 'mitt';
import { Database } from '~/infra/db';

import { generatePatient } from '~/dummyData/patients';

const TARGET_DUMMY_PATIENT_COUNT = 50;
const DUMMY_PATIENTS_PER_CHUNK = 5;

interface SyncRecord {
  recordType: string;
  data: any;
}

interface SyncSource {
  getReferenceData(since: Date): Promise<SyncRecord[]>;
  getPatientData(patientId: string, since: Date): Promise<SyncRecord[]>;
}

export class DummySyncSource implements SyncSource {
  async getReferenceData(since: Date): Promise<SyncRecord[]> {
    return [
      { recordType: 'fail-1', data: {} },
      { recordType: 'fail-2', data: {} },
      { recordType: 'fail-3', data: {} },
      { recordType: 'fail-4', data: {} },
    ];
  }

  async getPatientData(patientId: string, since: Date): Promise<SyncRecord[]> {
    return [];
  }
}

export class SyncManager {

  isSyncing = false; 
  emitter = mitt();

  constructor(syncSource: SyncSource) {
    this.syncSource = syncSource;

    this.emitter.on("recordSynced", (record) => console.log("synced record"));
    this.emitter.on("syncStarted", (record) => console.log("started sync"));
    this.emitter.on("referenceDownloadStarted", () => console.log('started ref download'));
    this.emitter.on("referenceDownloadEnded", () => console.log('finished ref download'));
    this.emitter.on("referenceSyncStarted", (count) => console.log(`syncing ${count} ref records`));
    this.emitter.on("referenceSyncEnded", () => console.log("finished ref sync"));
    this.emitter.on("patientSyncStarted", (count) => console.log(`syncing ${count} patient records`));
    this.emitter.on("patientSyncEnded", () => console.log('finished patient sync'));
    this.emitter.on("syncEnded", () => console.log('finished all sync'));
    this.emitter.on("syncedPatient", (id) => console.log(`synced patient ${id}`));
  }

  getModelForRecordType(recordType: string) {
    const { models } = Database;

    switch(recordType) {
      case "patient":
        return models.Patient;
      case "program":
        return models.Program;
      default:
        return null;
    }
  }

  async syncRecord(syncRecord: SyncRecord) {
    // write one single downloaded record to the database
    const { recordType, data } = syncRecord;
    const model = this.getModelForRecordType(recordType);
    if(!model) {
      console.warn(`No sync importer for record type ${recordType}`);
      return;
    }

    await model.createOrUpdate(data);
      
    this.emitter.emit("recordSynced", syncRecord);
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

    try { 
      const since = this.getReferenceSyncDate();
      this.emitter.emit("referenceDownloadStarted");
      const referenceRecords = await this.syncSource.getReferenceData(since);
      this.emitter.emit("referenceDownloadEnded");
      this.emitter.emit("referenceSyncStarted", referenceRecords.length);
      await Promise.all(referenceRecords.map(r => this.syncRecord(r)));
      this.emitter.emit("referenceSyncEnded");
    } catch(e) {
      console.error(e);
    }

    try { 
      const patientsToSync = await this.getPatientsToSync();
      this.emitter.emit("patientSyncStarted", patientsToSync.length);
      for(patient of patientsToSync) {
        await this.runPatientSync(patient);
      }
      this.emitter.emit("patientSyncEnded");
    } catch(e) {
      console.warn("!!!", e);
    }

    this.emitter.emit("syncEnded");
    this.isSyncing = false;
  }

  getReferenceSyncDate(): Date {
    return new Date();
  }

  getPatientsToSync() {
    const { models } = Database;
    return models.Patient.find({
      markedForSync: true, 
    });
  }

  // this is for when the user hits "sync this patient"
  async runPatientSync(patient: Patient) {
    // this will need to sync data that is older than whatever the "most recent
    // sync" would indicate
    // - just get all historical records for this patient?
    // - some kind of "lastFullSync" field on Patient? 
    const patientRecords = await this.syncSource.getPatientData(patient.id, patient.lastSynced);
    await Promise.all(patientRecords.map(r => this.syncRecord(r)));
    this.emitter.emit("syncedPatient", patient.id);
  }

}

