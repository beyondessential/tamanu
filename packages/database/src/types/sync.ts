import { Sequelize } from 'sequelize';
import type { SYNC_DIRECTIONS } from '@tamanu/constants';
import type { Models } from './model';
import type { SYNC_SESSION_DIRECTION } from '../sync/constants';

export interface SessionConfig {
  syncAllLabRequests: boolean;
}

export type SyncDirectionValues = (typeof SYNC_DIRECTIONS)[keyof typeof SYNC_DIRECTIONS];

export type SyncSessionDirectionValues =
  (typeof SYNC_SESSION_DIRECTION)[keyof typeof SYNC_SESSION_DIRECTION];

export interface Store {
  sequelize: Sequelize;
  models: Models;
}

export type RecordType = any;

export interface SyncSnapshotAttributes {
  id: number;
  direction: string;
  recordType: string;
  recordId: string;
  isDeleted: boolean;
  data: {
    id: number;
  };
  savedAtSyncTick: number;
  updatedAtByFieldSum: number;
  syncLookupId: number;
}
