import asyncHandler from 'express-async-handler';
import { unlink } from 'fs';
import config from 'config';

import { log } from 'shared/services/logging';

import { getUploadedData } from './getUploadedData';
import { sendSyncRequest } from './sendSyncRequest';

import { preprocessRecordSet } from './preprocessRecordSet';
import { WebRemote } from '../sync/WebRemote';

// we can't use the lodash groupBy, because this needs to handle `undefined`
function groupBy(array, key) {
  const map = new Map();
  for (const item of array) {
    const value = item[key];
    if (map.has(value)) {
      map.get(value).push(item);
    } else {
      map.set(value, [item]);
    }
  }
  return map.entries();
}

function getChannelFromRecordType(recordType) {
  if (recordType === 'referenceData') {
    return 'reference';
  }
  return recordType;
}

export async function sendRecordGroups(recordGroups) {
  const remote = new WebRemote();
  for (const [recordType, recordsForGroup] of recordGroups) {
    const recordsByChannel = groupBy(recordsForGroup, 'channel');
    const total = recordsForGroup.length;
    let completed = 0;
    log.debug(`sendRecordGroups: sending ${total} records`);
    for (const [maybeChannel, recordsForChannel] of recordsByChannel) {
      const channel = maybeChannel || getChannelFromRecordType(recordType);
      await sendSyncRequest(remote, channel, recordsForChannel);
      completed += recordsForChannel.length;
      log.debug(`sendRecordGroups: sent ${completed} of ${total}`);
    }
    log.debug(`sendRecordGroups: finished sending ${total} records`);
  }
}

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
    await sendRecordGroups(recordGroups);

    sendResult({ sentData: true });
  });
}
