import mitt from 'mitt';

import { IUser } from '~/types';
import {
  AuthenticationError,
  invalidUserCredentialsMessage,
  invalidTokenMessage,
  generalErrorMessage,
} from '~/services/auth/error';

export type DownloadRecordsResponse = {
  count: number;
  cursor: string;
  records: SyncRecord[];
}

export type UploadRecordsResponse = {
  count: number;
  requestedAt: number;
}

export interface SyncRecord {
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
    since: string,
    limit: number,
  ): Promise<DownloadRecordsResponse | null>;

  uploadRecords(
    channel: string,
    records: object[],
  ): Promise<UploadRecordsResponse | null>;
}

const API_VERSION = 1;

const MAX_FETCH_WAIT_TIME = 45 * 1000; // 45 seconds in milliseconds

const createTimeoutPromise = (): Promise<void> => new Promise((resolve, reject) => {
  const id = setTimeout(() => {
    clearTimeout(id);
    reject(new Error('Network request timed out'));
  }, MAX_FETCH_WAIT_TIME);
});

const fetchWithTimeout = (url, config) => Promise.race([
  fetch(url, config),
  createTimeoutPromise(),
]);

export class WebSyncSource implements SyncSource {
  path: string;

  token: string | null;

  emitter = mitt();

  connect(host: string) {
    this.path = `${host}/v${API_VERSION}`;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  throwError(err: Error) {
    // emit error after throwing
    setTimeout(() => {
      this.emitter.emit('error', err);
    }, 1);
    throw err;
  }

  async downloadRecords(
    channel: string,
    since: string,
    limit: number,
  ): Promise<DownloadRecordsResponse | null> {
    try {
      // TODO: error handling (incl timeout & token revokation)
      const query = {
        since,
        limit,
      };
      const queryString = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
      const url = `${this.path}/sync/${encodeURIComponent(channel)}?${queryString}`;

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        },
      });
      if (response.status === 401) {
        throw new AuthenticationError(invalidTokenMessage);
      }
      return await response.json();
    } catch (err) {
      this.throwError(err);
    }
  }

  async uploadRecords(channel: string, records: SyncRecord[]): Promise<UploadRecordsResponse | null> {
    try {
      const url = `${this.path}/sync/${encodeURIComponent(channel)}`;
      const rawResponse = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(records),
      });
      if (rawResponse.status === 401) {
        throw new AuthenticationError(invalidTokenMessage);
      }
      const response = await rawResponse.json();
      return response;
    } catch (err) {
      this.throwError(err);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const url = `${this.path}/login`;

      const body = JSON.stringify({ email, password });

      const response = await fetchWithTimeout(url, {
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
    } catch (err) {
      this.throwError(err);
    }
  }
}
