import { get } from 'lodash';

import { compareModelPriority } from 'shared/models/sync/order';

import { validateRecordSet } from './validateRecordSet';

function groupRecordsByType(records) {
  return records.reduce(
    (state, record) => ({
      ...state,
      [record.recordType]: (state[record.recordType] || []).concat([record]),
    }),
    {},
  );
}

function getRecordCounts(recordsByType) {
  // get some analytics
  const recordCounts = {};
  let total = 0;

  // count base record types
  Object.entries(recordsByType).forEach(([k, v]) => {
    recordCounts[k] = v.length;
    total += v.length;
  });
  recordCounts.total = total;

  // count reference data records by subtype
  (recordsByType.referenceData || []).forEach(record => {
    const key = `referenceData:${record.data.type}`;
    recordCounts[key] = (recordCounts[key] || 0) + 1;
  });

  // count encounter data records by subtype
  (recordsByType.encounter || []).forEach(record => {
    if (get(record, 'data.administeredVaccines.length') > 0) {
      const key = `encounter:administeredVaccine`;
      recordCounts[key] = (recordCounts[key] || 0) + 1;
    }
  });

  return recordCounts;
}

export async function preprocessRecordSet(recordSet) {
  const { records, errors = [] } = await validateRecordSet(recordSet);

  // split up records according to record type
  const recordsByType = groupRecordsByType(records);
  const errorsByType = groupRecordsByType(errors);

  // sort into safe order
  const sortedRecordGroups = Object.entries(recordsByType).sort((a, b) => {
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
