import { IUser } from '~/types';

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
  ERROR_MESSAGE?: string;
  recordType: string;
  isDeleted?: boolean;
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
  user: IUser;
  localisation: object;
  permissions: [];
}

export enum SYNC_EVENT_ACTIONS {
  SYNC_STARTED = 'syncStarted',
  SYNC_IN_PROGRESS = 'syncInProgress',
  SYNC_ENDED = 'syncEnded',
  SYNC_ERROR = 'syncRecordError',
  SYNC_RECORD_ERROR = 'syncRecordError',
}
