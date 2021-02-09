import { IUser } from '~/types';
import {
  AuthenticationError,
  invalidUserCredentialsMessage,
  generalErrorMessage,
} from '../ui/contexts/authContext/auth-error';

export type DownloadRecordsResponse = {
  count: number;
  requestedAt: number;
  records: SyncRecord[];
}

export type UploadRecordsResponse = {
  count: number;
  requestedAt: number;
}

export interface SyncRecord {
  lastSynced?: Date;
  ERROR_MESSAGE?: string;
  isDeleted?: boolean;
  data: SyncRecordData;
}

export interface SyncRecordData {
  id: string;
  [key: string]: any;
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
  ): Promise<DownloadRecordsResponse | null>;

  uploadRecords(
    channel: string,
    records: object[],
  ): Promise<UploadRecordsResponse | null>;
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
  ): Promise<DownloadRecordsResponse | null> {
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

  async uploadRecords(channel: string, records: SyncRecord[]): Promise<UploadRecordsResponse | null> {
    const url = `${this.host}/sync/${encodeURIComponent(channel)}`;
    try {
      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(records),
      });
      const response = await rawResponse.json();
      return response;
    } catch (error) {
      console.error(error);
      return null; // TODO: rework to return failed records
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

    if (response.status >= 500) {
      throw new AuthenticationError(generalErrorMessage);
    }

    if (response.status == 401) {
      throw new AuthenticationError(invalidUserCredentialsMessage);
    }

    const data = await response.json();

    if (!data.token || !data.user) {
      // auth failed in some other regard
      console.warn("Auth failed with an inexplicable error", data);
      throw new AuthenticationError(generalErrorMessage);
    }

    return data;
  }
}
