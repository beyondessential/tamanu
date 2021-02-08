import mitt from 'mitt';

import { Database } from '~/infra/db';
import { readConfig, writeConfig } from '~/services/config';
import { Patient } from '~/models/Patient';
import { BaseModel } from '~/models/BaseModel';
import { DownloadRecordsResponse, UploadRecordsResponse, SyncRecord, SyncSource } from './source';
import { createImportPlan, executeImportPlan } from './import';
import { buildToSyncRecord } from './export';

type RunChannelSyncOptions = {
  overrideLastSynced?: number,
}

const UPLOAD_LIMIT = 100;
const DOWNLOAD_LIMIT = 100;

export class SyncManager {
  isSyncing = false;

  progress = 0;

  emitter = mitt();

  errors = [];

  syncSource: SyncSource = null;

  constructor(syncSource: SyncSource) {
    this.syncSource = syncSource;

    this.emitter.on('*', (action, ...args) => {
      if (action === 'syncedRecord') return;
      if (action === 'syncRecordError') {
        this.errors.push(args[0]);
        console.warn('error', args[0]);
        return;
      }

      console.log(`[sync] ${String(action)} ${args[0] || ''}`);
    });
  }

  async runScheduledSync(): Promise<void> {
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
      console.warn('Tried to start syncing while sync in progress');
      return;
    }
    this.isSyncing = true;

    this.emitter.emit('syncStarted');

    const { models } = Database;
    await this.runChannelSync(models.ReferenceData, 'reference');
    await this.runChannelSync(models.User, 'user');
    await this.runChannelSync(models.ScheduledVaccine, 'scheduledVaccine');
    await this.runChannelSync(models.Program, 'program');
    await this.runChannelSync(models.Survey, 'survey');
    await this.runChannelSync(models.ProgramDataElement, 'programDataElement');
    await this.runChannelSync(models.SurveyScreenComponent, 'surveyScreenComponent');
    await this.runChannelSync(models.Patient, 'patient');

    await models.Encounter.mapSyncablePatientIds(async patientId => {
      await this.runPatientSync(patientId);
    });

    this.emitter.emit('syncEnded');
    this.isSyncing = false;
  }

  async markPatientForSync(patient: Patient): Promise<void> {
    patient.markedForSync = true;
    await patient.save();

    // TODO: this has room to be a bit more intelligent
    await this.runScheduledSync();
  }

  async downloadAndImport(model: typeof BaseModel, channel: string, since: number): Promise<number> {
    const downloadPage = (pageNumber: number): Promise<DownloadRecordsResponse> => {
      this.emitter.emit('downloadingPage', `${channel}-${pageNumber}`);
      return this.syncSource.downloadRecords(
        channel,
        since,
        pageNumber,
        DOWNLOAD_LIMIT,
      );
    };

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

    let requestedAt: number = null;

    // Some records will fail on the first attempt due to foreign key constraints
    // (most commonly, when a dependency record has been updated so it appears
    // after its dependent in the sync queue)
    // So we keep these records in a queue and retry them at the end of the download.
    let pendingRecords = [];

    const importPlan = createImportPlan(model);
    const importRecords = async (records: SyncRecord[]): Promise<void> => {
      await Promise.all(records.map(async r => {
        try {
          await executeImportPlan(importPlan, r);
          this.emitter.emit('syncedRecord', model.name);
        } catch (e) {
          if (e.message.match(/FOREIGN KEY constraint failed/)) {
            // this error is to be expected! just push it
            r.ERROR_MESSAGE = e.message;
            pendingRecords.push(r);
          } else {
            console.warn('syncRecordError', e, r);
            this.emitter.emit('syncRecordError', {
              record: r,
              error: e,
            });
          }
        }
      }));
    };

    try {
      let importTask: Promise<void>;
      let page = 0;
      this.emitter.emit('importStarted', channel);
      while (true) {
        // We want to download each page of records while the current page
        // of records is being imported - this means that the database IO
        // and network IO are running in parallel rather than running in
        // alternating sequence.
        const downloadTask = downloadPage(page);

        // wait for import task to complete before progressing in loop
        await importTask;

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
        this.emitter.emit('importingPage', `${channel}-${page}`);
        importTask = importRecords(response.records);
        requestedAt = requestedAt || response.requestedAt;

        page += 1;
      }
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
      await importRecords(thisPass);
      // syncRecords will re populate pendingRecords
      if (pendingRecords.length === thisPass.length) {
        console.warn('Could not import remaining queue members:');
        console.warn(JSON.stringify(pendingRecords, null, 2));
        pendingRecords.map(r => this.errors.push(r));
        throw new Error(`Could not import any ${pendingRecords.length} remaining queue members`);
      }
    }
    this.emitter.emit('importEnded', channel);

    return requestedAt;
  }

  async exportAndUpload(model: typeof BaseModel, channel: string) {
    // function definitions
    const exportRecords = async (page: number, afterRecord?: BaseModel): Promise<BaseModel[]> => {
      this.emitter.emit('exportingPage', `${channel}-${page}`);
      return model.findMarkedForUpload({
        channel,
        after: afterRecord,
        limit: UPLOAD_LIMIT,
      });
    }

    const toSyncRecord = buildToSyncRecord(model);
    const uploadRecords = async (page: number, records: BaseModel[]): Promise<UploadRecordsResponse> => {
      // TODO: detect and retry failures (need to pass back from server)
      this.emitter.emit('uploadingPage', `${channel}-${page}`);
      const syncRecords = records.map(r => toSyncRecord(r));
      return this.syncSource.uploadRecords(channel, syncRecords);
    }

    const markRecordsUploaded = async (page: number, records: BaseModel[], requestedAt: number): Promise<void> => {
      this.emitter.emit('markingPageUploaded', `${channel}-${page}`);
      return model.markUploaded(records.map(r => r.id), new Date(requestedAt));
    }

    // TODO: progress handling

    // export and upload loop
    try {
      let lastSeenRecord: BaseModel;
      let uploadPromise: Promise<UploadRecordsResponse>;
      this.emitter.emit('exportStarted', channel);
      let page = 0;
      while (true) {
        const knownPage = page;

        // begin exporting records
        const exportPromise = exportRecords(knownPage, lastSeenRecord);

        // finish uploading previous batch
        await uploadPromise;

        // finish exporting records
        const recordsChunk = await exportPromise;
        if (recordsChunk.length === 0) {
          break;
        }
        lastSeenRecord = recordsChunk[recordsChunk.length - 1];

        // begin uploading current batch
        uploadPromise = uploadRecords(knownPage, recordsChunk).then(async (data) => {
          // mark previous batch as synced after uploading
          // done using promises so these two steps can be interleaved with exporting
          await markRecordsUploaded(knownPage, recordsChunk, data.requestedAt);
          return data;
        });

        page++;
      }
    } catch (e) {
      console.warn(e);
    }
    this.emitter.emit('exportEnded', channel);
  }

  async getChannelSyncTimestamp(channel: string): Promise<number> {
    const timestampString = await readConfig(`syncTimestamp.${channel}`, '0');
    const timestamp = parseInt(timestampString, 10);
    if (Number.isNaN(timestamp)) {
      return 0;
    }
    return timestamp;
  }

  async updateChannelSyncDate(channel: string, timestamp: number): Promise<void> {
    await writeConfig(`syncTimestamp.${channel}`, timestamp.toString());
  }

  async runChannelSync(
    model: typeof BaseModel,
    channel: string,
    { overrideLastSynced = null }: RunChannelSyncOptions = {},
  ): Promise<void> {
    const lastSynced = (overrideLastSynced === null)
      ? await this.getChannelSyncTimestamp(channel)
      : overrideLastSynced;

    this.emitter.emit('channelSyncStarted', channel);
    try {
      const requestedAt = await this.downloadAndImport(model, channel, lastSynced);
      if (model.shouldExport()) {
        await this.exportAndUpload(model, channel);
      }
      if (requestedAt !== null) {
        await this.updateChannelSyncDate(channel, requestedAt);
      }
    } catch (e) {
      console.error(e);
    }
    this.emitter.emit('channelSyncEnded', channel);
  }

  async runPatientSync(patientId: string): Promise<void> {
    await this.runChannelSync(Database.models.Encounter, `patient/${patientId}/encounter`);
  }
}
