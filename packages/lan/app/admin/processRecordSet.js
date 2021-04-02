import { compareModelPriority } from 'shared/models/sync/order';

import { validateRecordSet } from './importerValidators';

function groupRecordsByType(records) {
  return records
    .reduce((state, record) => ({
      ...state,
      [record.recordType]: (state[record.recordType] || []).concat([record]),
    }), {});
}

function getRecordCounts(recordsByType) {
  // get some analytics
  const recordCounts = {};
  let total = 0;
  Object.entries(recordsByType).map(([k, v]) => {
    recordCounts[k] = v.length;
    total += v.length;
  });
  (recordsByType.referenceData || []).map(record => {
    const key = `referenceData:${record.data.type}`;
    recordCounts[key] = (recordCounts[key] || 0) + 1;
  });
  recordCounts.total = total;

  return recordCounts;
}

export async function processRecordSet(recordSet) {
  const { 
    records,
    errors = [],
  } = await validateRecordSet(recordSet);

  // split up records according to record type
  const recordsByType = groupRecordsByType(records);
  const errorsByType = groupRecordsByType(errors);

  // sort into safe order
  const sortedRecordGroups = Object.entries(recordsByType)
    .sort((a, b) => {
      return compareModelPriority(a[0], b[0]);
    });

  return {
    recordGroups: sortedRecordGroups,
    errors,
    stats: {
      records: getRecordCounts(recordsByType),
      errors: getRecordCounts(errorsByType),
    },
  };
}
