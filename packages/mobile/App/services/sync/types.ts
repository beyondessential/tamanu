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

// the mfa/login completion endpoints mobile drives — a fixed allowlist, so a
// caller can never steer the request into an arbitrary URL path
export const MFA_LOGIN_STEPS = ['totp', 'totp/enrol', 'totp/confirm'] as const;
export type MfaLoginStep = (typeof MFA_LOGIN_STEPS)[number];

// what the non-terminal totp/enrol step answers with
export interface MfaEnrolResponse {
  otpauthUrl: string;
}

export interface MfaPending {
  // mobile only completes 'challenge'/'enrol' via TOTP (WebAuthn on mobile is
  // a separate future effort)
  kind: string;
  factors: string[];
  skippable?: boolean;
  // short-lived token for the mfa/login completion endpoints
  token: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: IUser;
  localisation: object;
  settings: object;
  permissions: [];
  allowedFacilities: { id: string }[] | 'ALL';
  // present instead of the tokens when a second factor is still owed
  mfaPending?: MfaPending;
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
