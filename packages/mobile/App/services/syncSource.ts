import { IUser } from '~/types';
import {
  AuthenticationError,
  invalidUserCredentialsMessage,
} from '../ui/contexts/authContext/auth-error';

export interface SyncRecordData {
  id: string;
  updatedAt: Date;
  [key: string]: any;
}

export type GetSyncDataResponse = null | {
  count: number;
  requestedAt: string;
  records: SyncRecord[];
}

export interface SyncRecord {
  recordType: string;
  lastSynced: Date;
  ERROR_MESSAGE?: string;
  isDeleted?: boolean;
  data: SyncRecordData;
}

export interface LoginResponse {
  token: string;
  user: IUser;
}

export interface SyncSource {
  getSyncData(
    channel: string,
    since: Date,
    page: number,
    singlePageMode: boolean,
  ): Promise<GetSyncDataResponse>;
}

export class WebSyncSource implements SyncSource {
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  async getSyncData(
    channel: string,
    since: Date,
    page: number,
    singlePageMode = false,
  ): Promise<GetSyncDataResponse> {
    // TODO: error handling (incl timeout)
    const pageLimit = singlePageMode ? 0 : 100;
    const sinceStamp = since.valueOf();
    const url = `${this.host}/sync/${channel}?since=${sinceStamp}&page=${page}&limit=${pageLimit}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          authorization: 'Bearer fake-token',
        },
      });
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const url = `${this.host}/login`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/JSON',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      return response.json();
    } catch (error) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }
  }
}
