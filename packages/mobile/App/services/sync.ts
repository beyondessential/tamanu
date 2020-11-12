import mitt from 'mitt';
import { Database } from '~/infra/db';

import { readConfig, writeConfig } from '~/services/config';
import {GetSyncDataResponse, SyncRecord, SyncSource} from './syncSource';
import {Patient} from "~/models";

class NoSyncImporterError extends Error {
  constructor(recordType) {
    super(`No sync importer for record type ${recordType}`);
  }
}

export class SyncManager {
  isSyncing = false;

  progress = 0;

  lastSyncTime: Date | null = null;

  emitter = mitt();

  constructor(syncSource: SyncSource) {
    this.syncSource = syncSource;

    this.emitter.on("*", (action, ...args) => {
      if(action === 'syncedRecord') return;

      console.log(`[sync] ${action} ${args[0] || ''}`);
    });
  }

  getModelForRecordType(recordType: string) {
    const { models } = Database;

    switch(recordType) {
      case "patient":
        return models.Patient;
      case "user":
        return models.User;
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

    await this.runChannelSync('reference');
    await this.runChannelSync('user');
    await this.runChannelSync('survey');
    await this.runChannelSync('patient');

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
    this.lastSyncTime = new Date();
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

    const downloadPage = (pageNumber) => {
      this.emitter.emit("downloadingPage", `${channel}-${pageNumber}`);
      return this.syncSource.getSyncData(
        channel,
        since,
        pageNumber,
      );
    }

    let numDownloaded = 0;
    const setProgress = (progress): void => {
      this.progress = progress;
      this.emitter.emit('progress', this.progress);
    };
    const updateProgress = (stepSize, total): void => {
      numDownloaded += stepSize;
      setProgress(Math.ceil((numDownloaded / total) * 100));
    };
    setProgress(0);

    // we want to download each page of records while the current page
    // of records is being imported - this means that the database IO
    // and network IO are running in parallel rather than running in
    // alternating sequence.
    let downloadTask : Promise<GetSyncDataResponse> = downloadPage(0);

    let maxDate = since;

    try {
      while(true) {
        // wait for the current page download to complete
        const response = await downloadTask;

        if (response === null) {
          // ran into an error
          break;
        }

        // keep importing until we hit a page with 0 records
        // (this does mean we're always making 1 more web request than
        // is necessary, probably room for optimisation here)
        if(response.records.length === 0) {
          break;
        }

        updateProgress(response.records.length, response.count);

        // we have records to import - import them
        this.emitter.emit("importingPage", `${channel}-${page}`);
        const importTask = Promise.all(response.records.map(r => {
          if(r.lastSynced > maxDate) {
            maxDate = r.lastSynced;
          }
          return this.syncRecord(r);
        }));

        // start downloading the next page now
        page += 1;
        downloadTask = downloadPage(page);

        // wait for import task to complete before progressing in loop
        await importTask;
      };
    } catch(e) {
      console.warn(e);
    }

    return maxDate;
  }

  async getChannelSyncDate(channel): Promise<Date> {
    const timestampString = await readConfig(`${channel}SyncDate`, '0');
    const timestamp = parseInt(timestampString, 10);
    return new Date(timestamp);
  }

  async updateChannelSyncDate(channel, date: Date): Promise<void> {
    const timestampString = `${date.valueOf()}`;
    await writeConfig(`${channel}SyncDate`, timestampString);
  }

  async runChannelSync(channel: string): Promise<void> {
    const lastSynced = await this.getChannelSyncDate(channel);

    this.emitter.emit(`${channel}SyncStarted`);
    const maxDate = await this.syncAllPages(channel, lastSynced, () => undefined);
    this.emitter.emit(`${channel}SyncEnded`);

    await this.updateChannelSyncDate(channel, maxDate);
  }

  async runPatientSync(patient: Patient): Promise<void> {
    await this.syncAllPages(`patient/${patient.id}`, patient.lastSynced, () => undefined);

    // eslint-disable-next-line no-param-reassign
    patient.lastSynced = new Date();
    await patient.save();
  }
}
