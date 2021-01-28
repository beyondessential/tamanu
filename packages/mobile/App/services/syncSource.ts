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
  requestedAt: number;
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
    since: number,
    page: number,
    limit: number,
  ): Promise<GetSyncDataResponse>;

  uploadRecords(
    channel: string,
    records: object[],
  ): Promise<number>;
}

export class WebSyncSource implements SyncSource {
  host: string;

  constructor(host: string) {
    this.host = host;
  }

  async downloadRecords(
    channel: string,
    since: number,
    page: number,
    limit: number,
  ): Promise<GetSyncDataResponse> {
    // TODO: error handling (incl timeout)
    const url = `${this.host}/sync/${encodeURIComponent(channel)}?since=${since}&page=${page}&limit=${limit}`;

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

  async uploadRecords(channel: string, records: object[]): Promise<number> {
    const url = `${this.host}/sync/${encodeURIComponent(channel)}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(records),
      });
      const { count } = await response.json();
      if (count !== records.length) {
        throw new Error(
          `uploaded ${records.length} records but returned count was ${count}`,
        );
      }
      return count;
    } catch (error) {
      console.error(error);
      return 0; // TODO: rework to return failed records
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const url = `${this.host}/login`;

    const body = JSON.stringify({ email, password });

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

    const data = await response.json();

    if(!data.token || !data.user) {
      // auth failed in some other regard
      console.warn("Auth failed with an inexplicable error", data);
      throw new AuthenticationError(generalErrorMessage);
    }

    return data;
  }
}
