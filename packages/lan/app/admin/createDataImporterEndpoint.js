import asyncHandler from 'express-async-handler';
import { unlink } from 'fs';

import { getUploadedData } from './getUploadedData';
import { sendSyncRequest } from './sendSyncRequest';

import { compareModelPriority } from 'shared/models/sync/order';

export function createDataImporterEndpoint(importer) {
  return asyncHandler(async (req, res) => {
    const start = Date.now();

    // read uploaded data
    const { 
      file,
      deleteFileAfterImport,
      dryRun = false,
      allowErrors = false,
      ...metadata
    } = await getUploadedData(req);

    // parse uploaded file
    const {
      records,
      errors = [],
      ...importerOutput
    } = await importer({
      file,
      ...metadata,
    });

    // we don't need the file any more
    if(deleteFileAfterImport) {
      unlink(file, () => null);
    }

    // split up records according to record type
    const recordsByType = records
      .reduce((state, record) => ({
        ...state,
        [record.recordType]: (state[record.recordType] || []).concat([record]),
      }), {});

    // get some analytics
    const recordCounts = {};
    Object.entries(recordsByType).map(([k, v]) => {
      recordCounts[k] = v.length;
    });
    (recordsByType.referenceData || []).map(record => {
      const key = `referenceData.${record.data.type}`;
      recordCounts[key] = (recordCounts[key] || 0) + 1;
    });
    recordCounts.total = records.length;

    // sort into safe order
    const sortedRecordGroups = Object.entries(recordsByType)
      .sort((a, b) => {
        return compareModelPriority(a[0], b[0]);
      });

    const sendResult = (extraData = {}) => res.send({
      errors,
      duration: (Date.now() - start) / 1000.0,
      recordCounts,
      ...importerOutput,
      ...extraData,
    });

    // bail out early
    if(dryRun) {
      sendResult({ sentData: false, didntSendReason: "dry run" });
      return;
    } else if(errors.length > 0 && !allowErrors) {
      sendResult({ sentData: false, didntSendReason: "validation failed" });
      return;
    }

    // send to sync server in batches
    for(const [k, v] of sortedRecordGroups) {
      if(k === 'referenceData') {
        await sendSyncRequest('reference', v);
      } else {
        await sendSyncRequest(k, v);
      }
    }

    sendResult({ sentData: true });
  });
}
