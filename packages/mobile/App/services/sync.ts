import mitt from 'mitt';
import { Database } from '~/infra/db';

import { Chance } from 'chance';
import { generatePatient } from '~/dummyData/patients';


interface SyncRecord {
  recordType: string;
  data: any;
}

const generator = new Chance('patients');
const DUMMY_PATIENT_COUNT = 10;
const dummyPatients = (new Array(DUMMY_PATIENT_COUNT))
  .fill(0)
  .map(() => generatePatient(generator))
  .map(p => ({ 
    ...p, 
    lastModified: new Date(new Date() - 100000000)
  }));
const dummyPatientRecords : SyncRecord[] = dummyPatients.map(p => ({
  data: p,
  recordType: 'patient',
}));

interface SyncSource {
  getReferenceData(since: Date): Promise<SyncRecord[]>;
  getPatientData(patientId: string, since: Date): Promise<SyncRecord[]>;
}

export class DummySyncSource implements SyncSource {
  async getReferenceData(since: Date): Promise<SyncRecord[]> {
    const records = [
      ...dummyPatientRecords,
    ].filter(x => x.data.lastModified > since);
    // simulate a download delay
    await new Promise((resolve) => setTimeout(resolve, 100 * records.length));
    return records;
  }

  async getPatientData(patientId: string, since: Date): Promise<SyncRecord[]> {
    return [];
  }
}

export class SyncManager {

  isSyncing = false; 
  emitter = mitt();

  referenceSyncDate = new Date(new Date() - 1000000000)

  constructor(syncSource: SyncSource) {
    this.syncSource = syncSource;

    this.emitter.on("*", (...args) => console.log(JSON.stringify(args)));
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

    try { 
      const since = this.getReferenceSyncDate();
      this.emitter.emit("referenceDownloadStarted");
      const referenceRecords = await this.syncSource.getReferenceData(since);
      this.emitter.emit("referenceDownloadEnded");
      this.emitter.emit("referenceSyncStarted", referenceRecords.length);
      await Promise.all(referenceRecords.map(r => this.syncRecord(r)));
      this.emitter.emit("referenceSyncEnded");

      this.updateReferenceSyncDate();
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
    return this.referenceSyncDate;
  }

  updateReferenceSyncDate() {
    this.referenceSyncDate = new Date();
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
    this.emitter.emit("syncedPatient", patient.id);
  }

}

