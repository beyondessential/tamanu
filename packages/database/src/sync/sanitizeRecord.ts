import type { SyncSnapshotData } from 'types/sync';
import { COLUMNS_EXCLUDED_FROM_SYNC } from './constants';
import type { Model } from 'models/Model';

export const sanitizeRecord = (record: Model): SyncSnapshotData =>
  Object.fromEntries(
    Object.entries(record)
      // don't sync metadata columns like updatedAt
      .filter(([c]) => !COLUMNS_EXCLUDED_FROM_SYNC.includes(c)),
  ) as SyncSnapshotData;
