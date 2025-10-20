import { IUser } from '../../types';
import { callWithBackoffOptions } from './utils/callWithBackoff';
import { SYNC_SESSION_DIRECTION } from './constants';

export type DownloadRecordsResponse = {
  count: number;
  cursor: string;
  records: SyncRecord[];
};

export type UploadRecordsResponse = {
  count: number;
  requestedAt: number;
};

export interface SyncRecord {
  id: string;
  recordId: string;
  recordType: string;
  data: SyncRecordData;
  sortOrder?: number;
  isDeleted?: boolean;
  direction?: SYNC_SESSION_DIRECTION
}

export type PersistResult = {
  failures: string[];
};

export type DataToPersist = {
  id: string;
  deletedAt: string | null;
  [key: string]: unknown;
};

export interface SyncRecordData {
  id: string;
  [key: string]: any;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: IUser;
  localisation: object;
  settings: object;
  permissions: [];
  allowedFacilities: { id: string }[] | 'ALL';
}

export type FetchOptions = {
  backoff?: callWithBackoffOptions;
  skipAttemptRefresh?: boolean;
  timeout?: number;
  [key: string]: any;
};

export const SYNC_EVENT_ACTIONS = {
  SYNC_IN_QUEUE: 'syncInQueue',
  SYNC_STARTED: 'syncStarted',
  SYNC_STATE_CHANGED: 'syncStateChanged',
  SYNC_ENDED: 'syncEnded',
  SYNC_SUCCESS: 'syncSuccess',
  SYNC_ERROR: 'syncRecordError',
  SYNC_RECORD_ERROR: 'syncRecordError',
} as const;

export type SYNC_EVENT_ACTIONS = (typeof SYNC_EVENT_ACTIONS)[keyof typeof SYNC_EVENT_ACTIONS];
