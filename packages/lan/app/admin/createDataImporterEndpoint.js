import asyncHandler from 'express-async-handler';
import { unlink, existsSync } from 'fs';

import config from 'config';

import { getUploadedData } from './getUploadedData';
import { sendSyncRequest } from './sendSyncRequest';

import { compareModelPriority } from 'shared/models/sync/order';

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
    if(deleteFileAfterImport) {
      unlink(file, () => null);
    }

    const {
      recordGroups, 
      ...resultInfo
    } = await preprocessRecordSet(recordSet);

    const sendResult = (extraData = {}) => res.send({
      ...resultInfo,
      ...extraData,
      records: showRecords ? recordGroups : undefined,
      serverInfo: {
        host: config.sync.host,
      },
      duration: (Date.now() - start) / 1000.0,
    });

    // bail out early
    if(dryRun) {
      sendResult({ sentData: false, didntSendReason: "dryRun" });
      return;
    } else if(resultInfo.errors.length > 0 && !allowErrors) {
      sendResult({ sentData: false, didntSendReason: "validationFailed" });
      return;
    }

    // send to sync server in batches
    const remote = new WebRemote();
    for(const [recordType, record] of recordGroups) {
      const endpoint = (recordType === 'referenceData') ? 'reference' : recordType;
      await sendSyncRequest(remote, endpoint, record);
    }

    sendResult({ sentData: true });
  });
}
