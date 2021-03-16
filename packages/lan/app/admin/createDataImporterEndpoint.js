import asyncHandler from 'express-async-handler';
import { unlinkSync } from 'fs';

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

    const recordsByType = records
      .reduce((state, record) => ({
        ...state,
        [record.recordType]: (state[record.recordType] || []).concat([record]),
      }), {});

    // get analytics
    const recordCounts = {};
    Object.entries(recordsByType).map(([k, v]) => {
      recordCounts[k] = v.length;
    });
    (recordsByType.referenceData || []).map(record => {
      const key = `referenceData.${record.data.type}`;
      recordCounts[key] = (recordCounts[key] || 0) + 1;
    });
    recordCounts.total = records.length;

    // sync to server
    if(!dryRun) {
      for(const [k, v] of Object.entries(recordsByType)) {
        await sendSyncRequest(k, v);
      }
    }

    const results = {
      recordCounts,
      duration: (Date.now() - start) / 1000.0,
    };
    
    // send outcome
    res.send({ 
      success: true,
      results,
    });

    // clean up
    if(deleteFileAfterImport) {
      unlinkSync(file);
    }
  });
}
