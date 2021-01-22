import { IUser } from '~/types';
import {
  AuthenticationError,
  invalidUserCredentialsMessage,
  generalErrorMessage,
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
    const url = `${this.host}/sync/${encodeURIComponent(channel)}?since=${sinceStamp}&page=${page}&limit=${pageLimit}`;

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

    if(response.status >= 500) {
      throw new AuthenticationError(generalErrorMessage);
    }

    if(response.status >= 400) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    const data = response.json();

    return data;
  }
}
