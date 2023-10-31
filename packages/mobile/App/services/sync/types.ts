import { IUser } from '../../types';
import { callWithBackoffOptions } from './utils/callWithBackoff';

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
}

export type PersistResult = {
  failures: string[];
};

export type DataToPersist = {
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
  permissions: [];
}

export type FetchOptions = {
  backoff?: callWithBackoffOptions;
  skipAttemptRefresh?: boolean;
  [key: string]: any;
};

export enum SYNC_EVENT_ACTIONS {
  SYNC_STARTED = 'syncStarted',
  SYNC_STATE_CHANGED = 'syncStateChanged',
  SYNC_ENDED = 'syncEnded',
  SYNC_ERROR = 'syncRecordError',
  SYNC_RECORD_ERROR = 'syncRecordError',
}
