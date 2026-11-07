import type { IUser } from '../../types';
import type { callWithBackoffOptions } from './utils/callWithBackoff';
import type { SYNC_SESSION_DIRECTION } from './constants';

export interface SyncRecord {
  id: string;
  recordId: string;
  recordType: string;
  data: SyncRecordData;
  sortOrder?: number;
  isDeleted?: boolean;
  direction?: SYNC_SESSION_DIRECTION;
}

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
  /**
   * Send the request body (if large enough) as a JSON string with
   * Content-Encoding: gzip, so React Native's networking layer gzips it natively
   */
  compress?: boolean;
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

/**
 * Why a sync was started. Only a scheduled sync asks central whether there is anything to pull
 * before opening a session; every other reason opens one straight away.
 * spec: SYNCHK#mobile-devices
 */
export const SYNC_REASONS = {
  /** The periodic background sync */
  SCHEDULED: 'scheduled',
  /** The user signed in */
  SIGN_IN: 'signIn',
  /** The user signed back in with their password after the connection to central was lost */
  RECONNECT: 'reconnect',
  /** The user chose the device's facility, which runs its first sync */
  INITIAL: 'initial',
  /** The user pressed the sync button */
  MANUAL: 'manual',
  /** A sync that the user is waiting on, such as after marking a patient for sync */
  URGENT: 'urgent',
} as const;

export type SyncReason = (typeof SYNC_REASONS)[keyof typeof SYNC_REASONS];
