import asyncHandler from 'express-async-handler';
import { unlink } from 'fs';
import config from 'config';

import { getUploadedData } from './getUploadedData';
import { sendSyncRequest } from './sendSyncRequest';

import { preprocessRecordSet } from './preprocessRecordSet';
import { WebRemote } from '../sync/WebRemote';

export function createDataImporterEndpoint(importer) {
  return asyncHandler(async (req, res) => {
    const start = Date.now();

    // read uploaded data
    const {
      file,
      deleteFileAfterImport,
      dryRun = false,
      showRecords = false,
      allowErrors = false,
      ...metadata
    } = await getUploadedData(req);

    // parse uploaded file
    const recordSet = await importer({
      file,
      ...metadata,
    });

    // we don't need the file any more
    if (deleteFileAfterImport) {
      unlink(file, () => null);
    }

    const { recordGroups, ...resultInfo } = await preprocessRecordSet(recordSet);

    const sendResult = (extraData = {}) =>
      res.send({
        ...resultInfo,
        ...extraData,
        records: showRecords ? recordGroups : undefined,
        serverInfo: {
          host: config.sync.host,
        },
        duration: (Date.now() - start) / 1000.0,
      });

    // bail out early
    if (dryRun) {
      sendResult({ sentData: false, didntSendReason: 'dryRun' });
      return;
    }
    if (resultInfo.errors.length > 0 && !allowErrors) {
      sendResult({ sentData: false, didntSendReason: 'validationFailed' });
      return;
    }

    // send to sync server in batches
    const remote = new WebRemote();
    for (const [recordType, records] of recordGroups) {
      let endpoint;
      if (records[0].channel) {
        // Only allow fixed channel for now
        if (records.some(r => r.channel !== records[0].channel)) {
          throw new Error('Channel does not match between records');
        }
        endpoint = records[0].channel;
      } else {
        endpoint = recordType === 'referenceData' ? 'reference' : recordType;
      }
      await sendSyncRequest(remote, endpoint, records);
    }

    sendResult({ sentData: true });
  });
}
