import { Sequelize } from 'sequelize';
import type { SYNC_DIRECTIONS } from '@tamanu/constants';
import type { Models } from './model';
import type { SYNC_SESSION_DIRECTION } from '../sync/constants';
import type { ChangeLog } from 'models/ChangeLog';

export interface SessionConfig {
  syncAllLabRequests: boolean;
  isMobile: boolean;
}

export type SyncDirectionValues = (typeof SYNC_DIRECTIONS)[keyof typeof SYNC_DIRECTIONS];

export type SyncSessionDirectionValues =
  (typeof SYNC_SESSION_DIRECTION)[keyof typeof SYNC_SESSION_DIRECTION];

export interface Store {
  sequelize: Sequelize;
  models: Models;
}

export type RecordType = any;

export interface SyncSnapshotData {
  id: number;
  [key: string]: any;
}

export interface SyncSnapshotAttributes {
  id: number;
  direction: string;
  recordType: string;
  recordId: string;
  isDeleted: boolean;
  data: SyncSnapshotData;
  savedAtSyncTick: number;
  updatedAtByFieldSum?: number; // only for merged records
  syncLookupId?: number; // no syncLookupId if it is an incoming record
  requiresRepull?: boolean;
}

export interface SyncSnapshotAttributesWithChangelog extends SyncSnapshotAttributes {
  changelogRecords?: ChangeLog[];
}

export type UninsertedSyncSnapshotAttributes = Omit<
  SyncSnapshotAttributes,
  'id' | 'savedAtSyncTick'
>;

export type SyncHookSnapshotChanges = {
  inserts: UninsertedSyncSnapshotAttributes[];
  updates: SyncSnapshotAttributes[];
};

export type ModelSanitizeArgs<T extends Record<string, any> = { [key: string]: any }> = T;
