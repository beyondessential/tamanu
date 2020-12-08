import mitt from 'mitt';
import { Database } from '~/infra/db';

import { readConfig, writeConfig } from '~/services/config';
import { IPatient } from '~/types';
import { GetSyncDataResponse, SyncRecord, SyncSource } from './syncSource';

class NoSyncImporterError extends Error {
  constructor(recordType: string) {
    super(`No sync importer for record type ${recordType}`);
  }
}

export class SyncManager {
  isSyncing = false;

  progress = 0;

  emitter = mitt();

  errors = [];

  syncSource: SyncSource = null;

  constructor(syncSource: SyncSource) {
    this.syncSource = syncSource;

    this.emitter.on("*", (action, ...args) => {
      if (action === 'syncedRecord') return;
      if (action === 'syncRecordError') {
        this.errors.push(args[0]);
        console.warn('error', args[0]);
        return;
      }

      console.log(`[sync] ${String(action)} ${args[0] || ''}`);
    });
  }

  getModelForRecordType(recordType: string) {
    const { models } = Database;

    switch (recordType) {
      case "patient":
        return models.Patient;
      case "user":
        return models.User;
      case "referenceData":
        return models.ReferenceData;
      case 'scheduledVaccine':
        return models.ScheduledVaccine;
      case "program":
        return models.Program;
      case "survey":
        return models.Survey;
      case "surveyScreenComponent":
        return models.SurveyScreenComponent;
      case "programDataElement":
        return models.ProgramDataElement;
      default:
        return null;
    }
  }

  async syncRecord(syncRecord: SyncRecord) {
    // write one single downloaded record to the database
    const { recordType, data } = syncRecord;

    const model = this.getModelForRecordType(recordType);
    if (!model) {
      throw new NoSyncImporterError(recordType);
    }

    await model.createOrUpdate(data);

    this.emitter.emit("syncedRecord", syncRecord.recordType);
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

    if (this.isSyncing) {
      console.warn("Tried to start syncing while sync in progress");
      return;
    }
    this.isSyncing = true;

    this.emitter.emit("syncStarted");

    await this.runChannelSync('reference');
    await this.runChannelSync('user');
    await this.runChannelSync('vaccination');
    await this.runChannelSync('survey', null, true);
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
  }

  getPatientsToSync() {
    const { models } = Database;
    return models.Patient.find({
      markedForSync: true,
    });
  }

  async markPatientForSync(patient: IPatient) {
    patient.markedForSync = true;
    await patient.save();

    // TODO: this has room to be a bit more intelligent
    this.runScheduledSync();
  }

  async syncAllPages(channel: string, since: Date, singlePageMode = false) {
    let page = 0;

    const downloadPage = (pageNumber: number) => {
      this.emitter.emit("downloadingPage", `${channel}-${pageNumber}`);
      return this.syncSource.getSyncData(
        channel,
        since,
        pageNumber,
        singlePageMode,
      );
    }

    let numDownloaded = 0;
    const setProgress = (progress: number): void => {
      this.progress = progress;
      this.emitter.emit('progress', this.progress);
    };
    const updateProgress = (stepSize: number, total: number): void => {
      numDownloaded += stepSize;
      setProgress(Math.ceil((numDownloaded / total) * 100));
    };
    setProgress(0);

    // We want to download each page of records while the current page
    // of records is being imported - this means that the database IO
    // and network IO are running in parallel rather than running in
    // alternating sequence.
    let downloadTask: Promise<GetSyncDataResponse> = downloadPage(0);

    let maxDate = since;

    // Some records will fail on the first attempt due to foreign key constraints
    // (most commonly, when a dependency record has been updated so it appears 
    // after its dependent in the sync queue)
    // So we keep these records in a queue and retry them at the end of the download.
    let pendingRecords = [];

    const syncRecords = (records: SyncRecord[]) => {
      return Promise.all(records.map(async r => {
        try {
          await this.syncRecord(r);

          if (r.lastSynced > maxDate) {
            maxDate = r.lastSynced;
          }
        } catch (e) {
          if (e.message.match(/FOREIGN KEY constraint failed/)) {
            // this error is to be expected! just push it
            r.ERROR_MESSAGE = e.message;
            pendingRecords.push(r);
          } else {
            console.warn("syncRecordError", e, r);
            this.emitter.emit("syncRecordError", {
              record: r,
              error: e,
            });
          }
        }
      }));
    };


    try {
      while (true) {
        // wait for the current page download to complete
        const response = await downloadTask;

        if (response === null) {
          // ran into an error
          break;
        }

        // keep importing until we hit a page with 0 records
        // (this does mean we're always making 1 more web request than
        // is necessary, probably room for optimisation here)
        if (response.records.length === 0) {
          break;
        }

        updateProgress(response.records.length, response.count);

        // we have records to import - import them
        this.emitter.emit("importingPage", `${channel}-${page}`);
        const importTask = syncRecords(response.records);

        if (singlePageMode) {
          await importTask;
          break;
        }

        // start downloading the next page now
        page += 1;
        downloadTask = downloadPage(page);

        // wait for import task to complete before progressing in loop
        await importTask;
      };
    } catch (e) {
      console.warn(e);
    }

    // Now try re-importing all of the pending records.
    // As there might be multiple levels of dependency, we might need a few 
    // passes over the queue! But if we get a pass where the queue doesn't 
    // decrease in size at all, we know there's a for-real error and we should
    // terminate the process.
    while (pendingRecords.length > 0) {
      console.log(`Reattempting ${pendingRecords.length} failed records...`);
      const thisPass = pendingRecords;
      pendingRecords = [];
      await syncRecords(thisPass);
      // syncRecords will re populate pendingRecords
      if (pendingRecords.length === thisPass.length) {
        console.warn("Could not import remaining queue members:");
        console.warn(JSON.stringify(pendingRecords, null, 2));
        pendingRecords.map(r => this.errors.push(r));
        throw new Error(`Could not import any ${pendingRecords.length} remaining queue members`);
      }
    }

    return maxDate;
  }

  async getChannelSyncDate(channel: string): Promise<Date> {
    const timestampString = await readConfig(`syncDate.${channel}`, '0');
    const timestamp = parseInt(timestampString, 10);
    return new Date(timestamp);
  }

  async updateChannelSyncDate(channel: string, date: Date): Promise<void> {
    const timestampString = `${date.valueOf()}`;
    await writeConfig(`syncDate.${channel}`, timestampString);
  }

  async runChannelSync(channel: string, overrideLastSynced = null, singlePageMode = false): Promise<void> {
    const lastSynced = (overrideLastSynced === null)
      ? await this.getChannelSyncDate(channel)
      : overrideLastSynced;


    this.emitter.emit('channelSyncStarted', channel);
    try {
      const maxDate = await this.syncAllPages(channel, lastSynced, singlePageMode);
      await this.updateChannelSyncDate(channel, maxDate);
    } catch (e) {
      console.error(e);
    }
    this.emitter.emit('channelSyncEnded', channel);
  }

  async runPatientSync(patient: Patient): Promise<void> {
    await this.syncAllPages(`patient/${patient.id}`, patient.lastSynced);

    // eslint-disable-next-line no-param-reassign
    patient.lastSynced = new Date();
    await patient.save();
  }
}
