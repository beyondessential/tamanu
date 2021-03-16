import asyncHandler from 'express-async-handler';
import { unlink } from 'fs';

import { getUploadedData } from './getUploadedData';
import { sendSyncRequest } from './sendSyncRequest';

export function createDataImporterEndpoint(importer) {
  return asyncHandler(async (req, res) => {
    const start = Date.now();

    // read uploaded data
    const { 
      file,
      deleteFileAfterImport,
      dryRun,
      ...metadata
    } = await getUploadedData(req);

    // parse uploaded file
    const records = await importer({
      file,
      metadata,
    });

    // we don't need the file any more
    if(deleteFileAfterImport) {
      unlink(file);
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

    // check for duplicate IDs
    const erroredRecords = [];
    Object.keys(recordsByType).map(k => {
      const ids = new Set();
      const records = recordsByType[k];
      records.map(r => {
        if(ids.has(r.data.id)) {
          erroredRecords.push({
            error: 'Duplicate ID',
            ...r,
          });
        } else {
          ids.add(r.data.id);
        }
      });
    });

    // bail out now if things are broken
    if(erroredRecords) {
      res.send({
        success: false,
        erroredRecords,
      });
      return;
    }

    // sync to server
    if(!dryRun) {
      // TODO: arrange records in safe import order
      for(const [k, v] of Object.entries(recordsByType)) {
        if(k === 'referenceData') {
          await sendSyncRequest('reference', v);
        } else {
          await sendSyncRequest(k, v);
        }
      }
    }

    // send outcome
    res.send({ 
      success: true,
      duration: (Date.now() - start) / 1000.0,
      recordCounts,
    });

  });
}
