import { pick } from 'es-toolkit/compat';

import type { DataToPersist, SyncRecord } from '../types';
import type { BaseModel } from '../../../models/BaseModel';
import { extractIncludedColumns } from './extractIncludedColumns';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

export const buildFromSyncRecord = (
  model: typeof BaseModel,
  records: SyncRecord[],
): DataToPersist[] => {
  const includedColumns = extractIncludedColumns(model);
  // Skip field mapping for raw insert - keep original field names
  return records.map(record => {
    const data = pick(record.data, includedColumns);
    data.deletedAt = record.isDeleted ? getCurrentDateTimeString() : null;
    return data as DataToPersist;
  });
};
