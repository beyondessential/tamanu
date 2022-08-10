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
  recordType: string,
  isDeleted?: boolean;
  data: SyncRecordData;
}

export type PersistResult = {
  failures: string[];
}

export type DataToPersist = {
  [key: string]: unknown
}

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
