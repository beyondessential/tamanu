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
  downloadRecords(
    channel: string,
    since: Date,
    page: number,
    limit: number,
  ): Promise<GetSyncDataResponse>;
}

export class WebSyncSource implements SyncSource {
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  async downloadRecords(
    channel: string,
    since: Date,
    page: number,
    limit: number,
  ): Promise<GetSyncDataResponse> {
    // TODO: error handling (incl timeout)
    const sinceStamp = since.valueOf();
    const url = `${this.host}/sync/${encodeURIComponent(channel)}?since=${sinceStamp}&page=${page}&limit=${limit}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer fake-token',
          'Accept': 'application/json',
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

    const body = { email, password };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if(response.status >= 500) {
      throw new AuthenticationError(generalErrorMessage);
    }

    if(response.status == 401) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    const data = response.json();

    if(!data.token || !data.user) {
      // auth failed in some other regard
      console.warn("Auth failed with an inexplicable error", data);
      throw new AuthenticationError(generalErrorMessage);
    }

    return data;
  }
}
