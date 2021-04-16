import mitt from 'mitt';

import { IUser } from '~/types';
import {
  AuthenticationError,
  invalidUserCredentialsMessage,
  invalidTokenMessage,
  generalErrorMessage,
} from '~/services/auth/error';
import { version } from '/root/package.json';

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
    records: object[]
  ): Promise<UploadRecordsResponse | null>;
}

const API_VERSION = 1;

const MAX_FETCH_WAIT_TIME = 45 * 1000; // 45 seconds in milliseconds

type TimeoutPromiseResponse = {
  promise: Promise<void>;
  cleanup: () => void;
};
const createTimeoutPromise = (): TimeoutPromiseResponse => {
  let cleanup: () => void;
  const promise: Promise<void> = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('Network request timed out'));
    }, MAX_FETCH_WAIT_TIME);
    cleanup = (): void => {
      clearTimeout(id);
      resolve();
    };
  });
  return { promise, cleanup };
};

const fetchWithTimeout = async (url, config): Promise<Response> => {
  const { cleanup, promise: timeoutPromise } = createTimeoutPromise();
  try {
    const response = await Promise.race([fetch(url, config), timeoutPromise]);
    return response;
  } finally {
    cleanup();
  }
};

const getResponseJsonSafely = async (response): Promise<Record<string, any>> => {
  try {
    return response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    console.error(e);
    return {};
  }
};

export class WebSyncSource implements SyncSource {
  host: string;

  token: string | null;

  emitter = mitt();

  connect(host: string) {
    this.host = host;
  }

  async fetch(path: string, config) {
    const url = `${this.host}/v${API_VERSION}/${path}`;
    const extraHeaders = config?.headers || {};
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'X-Runtime': 'Tamanu Mobile',
      'X-Version': version,
      ...extraHeaders,
    };
    const response = await fetchWithTimeout(url, {
      ...config,
      headers,
    });

    if (response.status === 401) {
      throw new AuthenticationError(path.includes('/login') ? invalidUserCredentialsMessage : invalidTokenMessage);
    }

    if (response.status === 400) {
      const { error } = await getResponseJsonSafely(response);
      if (error?.name === 'InvalidClientVersion') {
        const minAppVersion = response.headers.get('X-Min-Client-Version');
        const maxAppVersion = response.headers.get('X-Max-Client-Version');
        throw new AuthenticationError(
          `Your version of Tamanu Mobile is not supported. Please download and install a version between v${minAppVersion} and v${maxAppVersion}`,
        );
      }
    }

    if (!response.ok) {
      throw new Error(generalErrorMessage);
    }

    return response.json();
  }

  async get(path: string) {
    return this.fetch(path, { method: 'GET' });
  }

  async post(path: string, body) {
    return this.fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
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
      const path = `sync/${encodeURIComponent(channel)}?${queryString}`;

      const response = await this.get(path);
      return response;
    } catch (err) {
      this.throwError(err);
    }
  }

  async uploadRecords(
    channel: string,
    records: SyncRecord[]
  ): Promise<UploadRecordsResponse | null> {
    try {
      const path = `sync/${encodeURIComponent(channel)}`;
      const response = await this.post(path, JSON.stringify(records));
      return response;
    } catch (err) {
      this.throwError(err);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const data = await this.post('/login', JSON.stringify({ email, password }));

      if (!data.token || !data.user) {
        // auth failed in some other regard
        console.warn('Auth failed with an inexplicable error', data);
        throw new AuthenticationError(generalErrorMessage);
      }

      return data;
    } catch (err) {
      this.throwError(err);
    }
  }
}
