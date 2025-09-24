import { pick } from 'lodash';

import { DataToPersist, SyncRecord } from '../types';
import { BaseModel } from '../../../models/BaseModel';
import { extractIncludedColumns } from './extractIncludedColumns';

export const buildFromSyncRecord = (
  model: typeof BaseModel,
  records: SyncRecord[],
): DataToPersist[] => {
  const includedColumns = extractIncludedColumns(model);
  // Skip field mapping for raw insert - keep original field names
  return records.map(record => {
    const data = pick(record.data, includedColumns);
    data.deletedAt = record.isDeleted ? "datetime('now')" : null;
    return data as DataToPersist;
  });
};
