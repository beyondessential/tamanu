import { pick } from 'lodash';

import { DataToPersist, SyncRecord } from '../types';
import { BaseModel } from '../../../models/BaseModel';

export const buildFromSyncRecord = (
  model: typeof BaseModel,
  record: SyncRecord,
  includedColumns: string[],
): { data: DataToPersist; id: string } => {
  const sanitizeRecord = 'sanitizePulledRecord' in model && (model as any).sanitizePulledRecord;
  const sanitizedRecord = sanitizeRecord ? sanitizeRecord(record) : record;
  const data = pick(sanitizedRecord.data, includedColumns);
  data.deletedAt = record.isDeleted ? new Date().toISOString() : null;
  return { data: data as DataToPersist, id: record.id };
};
