import mitt from 'mitt';

import { Database } from '~/infra/db';
import { readConfig, writeConfig } from '~/services/config';
import { Patient } from '~/models/Patient';
import { BaseModel } from '~/models/BaseModel';
import { DownloadRecordsResponse, UploadRecordsResponse, SyncRecord, SyncSource } from './source';
import { createImportPlan, executeImportPlan } from './import';
import { createExportPlan, executeExportPlan } from './export';

export type SyncManagerOptions = {
  verbose?: boolean;
};

type Timestamp = number;

type ChannelInfo = {
  channel: string;
  model: typeof BaseModel;
  cursor?: string;
  serverHasChanges?: boolean;
};

const UPLOAD_LIMIT = 100;
const INITIAL_DOWNLOAD_LIMIT = 100;
const MIN_DOWNLOAD_LIMIT = 1;
const MAX_DOWNLOAD_LIMIT = 999; // match sql max params for optimum speed (avoid chunking id fetches)
const OPTIMAL_DOWNLOAD_TIME_PER_PAGE = 2000; // aim for 2 seconds per page
const MAX_LIMIT_CHANGE_PER_PAGE = 0.2; // max 20% increase from batch to batch, or it is too jumpy

// Set the current page size based on how long the previous page took to complete.
const calculateDynamicLimit = (currentLimit, downloadTime): number => {
  const durationPerRecord = downloadTime / currentLimit;
  const optimalPageSize = OPTIMAL_DOWNLOAD_TIME_PER_PAGE / durationPerRecord;
  let newLimit = optimalPageSize;

  newLimit = Math.floor(newLimit);
  newLimit = Math.max(
    newLimit,
    MIN_DOWNLOAD_LIMIT,
    Math.floor(currentLimit - currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
  );
  newLimit = Math.min(
    newLimit,
    MAX_DOWNLOAD_LIMIT,
    Math.floor(currentLimit + currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
  );
  return newLimit;
};
export class SyncManager {
  isSyncing = false;

  progress = 0;

  emitter = mitt();

  errors = [];

  syncSource: SyncSource = null;

  verbose = true;

  constructor(
    syncSource: SyncSource,
    { verbose }: SyncManagerOptions = {},
  ) {
    this.syncSource = syncSource;

    if (verbose !== undefined) {
      this.verbose = verbose;
    }

    this.emitter.on('*', (action, ...args) => {
      if (action === 'syncRecordError') {
        const syncError = args[0];
        this.errors.push(syncError);
        console.warn('Sync record error', syncError);
        return;
      }

      if (action === 'channelSyncError') {
        const syncError = args[0].error;
        this.errors.push(syncError);
        console.warn('Channel sync error', syncError);
        return;
      }

      if (this.verbose) {
        console.log(`[sync] ${String(action)} ${args[0] || ''}`);
      }
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

    try {
      this.isSyncing = true;
      this.errors = [];
      this.emitter.emit('syncStarted');

      const { models } = Database;
      const syncablePatients = await models.Patient.getSyncable();

      // channels in order of sync, so that foreign keys exist before referencing records use them
      const channelInfos: ChannelInfo[] = [
        { channel: 'reference', model: models.ReferenceData },
        { channel: 'user', model: models.User },

        { channel: 'scheduledVaccine', model: models.ScheduledVaccine },

        { channel: 'program', model: models.Program },
        { channel: 'survey', model: models.Survey },
        { channel: 'programDataElement', model: models.ProgramDataElement },
        { channel: 'surveyScreenComponent', model: models.SurveyScreenComponent },

        { channel: 'patient', model: models.Patient },
        ...syncablePatients.map(p => ({
          channel: `patient/${p.id}/encounter`,
          model: models.Encounter })),
        ...syncablePatients.map(p => ({
          channel: `patient/${p.id}/issue`,
          model: models.PatientIssue })),
      ];

      // add current cursor to each channel info
      await Promise.all(channelInfos.map(async ({ channel }, i) => {
        const cursor = await this.getChannelPullCursor(channel);
        channelInfos[i].cursor = cursor;
      }));

      // add pending changes state to each channel info
      const channelsWithChanges = await this.syncSource.fetchChannelsWithChanges(channelInfos);
      const channelsWithChangesSet = new Set(channelsWithChanges);
      channelInfos.forEach(({ channel }, i) => {
        channelInfos[i].serverHasChanges = channelsWithChangesSet.has(channel);
      });

      // run sync for each channel
      for (const channelInfo of channelInfos) {
        await this.runChannelSync(channelInfo);
      }
    } finally {
      this.isSyncing = false;
      this.emitter.emit('syncEnded');
    }
  }

  async markPatientForSync(patient: Patient): Promise<void> {
    patient.markedForSync = true;
    await patient.save();

    // TODO: this has room to be a bit more intelligent
    await this.runScheduledSync();
  }

  async downloadAndImport(
    model: typeof BaseModel,
    channel: string,
    initialCursor: string,
  ): Promise<void> {
    const downloadPage = (since: string, limit: number): Promise<DownloadRecordsResponse> => {
      this.emitter.emit('downloadingPage', `${channel}-since-${since}-limit-${limit}`);
      return this.syncSource.downloadRecords(channel, since, limit);
    };

    let numDownloaded = 0;
    const setProgress = (progress: number): void => {
      this.progress = progress;
      this.emitter.emit('progress', this.progress);
    };
    const updateProgress = (stepSize: number, remaining: number): void => {
      const total = numDownloaded + remaining;
      numDownloaded += stepSize;
      setProgress(Math.ceil((numDownloaded / total) * 100));
    };
    setProgress(0);

    const importPlan = createImportPlan(model);
    const importRecords = async (records: SyncRecord[], pullCursor: string): Promise<void> => {
      const { failures } = await executeImportPlan(importPlan, records);
      failures.forEach(({ error, recordId }) => {
        this.emitter.emit('syncRecordError', {
          record: { id: recordId },
          error,
        });
      });
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} individual record failures`,
        );
      }
      await this.updateChannelPullCursor(channel, pullCursor);
    };

    let cursor = initialCursor;
    let importTask: Promise<void>;
    let limit = INITIAL_DOWNLOAD_LIMIT;
    this.emitter.emit('importStarted', channel);
    while (true) {
      // We want to download each page of records while the current page
      // of records is being imported - this means that the database IO
      // and network IO are running in parallel rather than running in
      // alternating sequence.
      const startTime = Date.now();
      const downloadTask = downloadPage(cursor, limit);

      // wait for import task to complete before progressing in loop
      await importTask;

      // wait for the current page download to complete
      const response = await downloadTask;
      const downloadTime = Date.now() - startTime;

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

      cursor = response.cursor;

      // we have records to import - import them
      this.emitter.emit('importingPage', `${channel}-since-${cursor}-limit-${limit}`);
      importTask = importRecords(response.records, cursor);

      limit = calculateDynamicLimit(limit, downloadTime);
    }
    await importTask; // wait for any final import task to finish

    this.emitter.emit('importEnded', channel);
  }

  async exportAndUpload(model: typeof BaseModel, channel: string): Promise<void> {
    // function definitions
    const exportPlan = createExportPlan(model);
    const exportRecords = async (page: number, afterId?: string): Promise<SyncRecord[]> => {
      this.emitter.emit('exportingPage', `${channel}-${page}`);
      return (await model.findMarkedForUpload({
        channel,
        after: afterId,
        limit: UPLOAD_LIMIT,
      })).map(r => executeExportPlan(exportPlan, r));
    };

    const uploadRecords = async (
      page: number,
      syncRecords: SyncRecord[],
    ): Promise<UploadRecordsResponse> => {
      // TODO: detect and retry failures (need to pass back from server)
      this.emitter.emit('uploadingPage', `${channel}-${page}`);
      return this.syncSource.uploadRecords(channel, syncRecords);
    };

    const markRecordsUploaded = async (
      page: number,
      records: SyncRecord[],
      requestedAt: Timestamp,
    ): Promise<void> => {
      this.emitter.emit('markingPageUploaded', `${channel}-${page}`);
      return model.markUploaded(records.map(r => r.data.id), new Date(requestedAt));
    };

    // TODO: progress handling

    // export and upload loop
    let lastSeenId: string;
    let uploadPromise: Promise<UploadRecordsResponse>;
    this.emitter.emit('exportStarted', channel);
    let page = 0;
    while (true) {
      const knownPage = page;

      // begin exporting records
      const exportPromise = exportRecords(knownPage, lastSeenId);

      // finish uploading previous batch
      await uploadPromise;

      // finish exporting records
      const recordsChunk = await exportPromise;
      if (recordsChunk.length === 0) {
        break;
      }
      lastSeenId = recordsChunk[recordsChunk.length - 1].data.id;

      // begin uploading current batch
      uploadPromise = uploadRecords(knownPage, recordsChunk).then(async (data) => {
        // mark previous batch as synced after uploading
        // done using promises so these two steps can be interleaved with exporting
        await markRecordsUploaded(knownPage, recordsChunk, data.requestedAt);
        return data;
      });

      page++;
    }
    this.emitter.emit('exportEnded', channel);
  }

  async getChannelPullCursor(channel: string): Promise<string> {
    return readConfig(`pullCursor.${channel}`, '0');
  }

  async updateChannelPullCursor(channel: string, pullCursor: string): Promise<void> {
    await writeConfig(`pullCursor.${channel}`, pullCursor);
  }

  async runChannelSync(channelInfo: ChannelInfo): Promise<void> {
    const { channel, model, cursor, serverHasChanges } = channelInfo;
    this.emitter.emit('channelSyncStarted', channel);
    if (serverHasChanges) {
      try {
        await this.downloadAndImport(model, channel, cursor);
      } catch (e) {
        this.emitter.emit('channelSyncError', { channel, error: e.message });
      }
    }
    if (model.shouldExport) {
      try {
        await this.exportAndUpload(model, channel);
      } catch (e) {
        this.emitter.emit('channelSyncError', { channel, error: e.message });
      }
    }
    this.emitter.emit('channelSyncEnded', channel);
  }
}
