import mitt from 'mitt';
import { chunk } from 'lodash';

import { IUser } from '~/types';
import {
  AuthenticationError,
  OutdatedVersionError,
  invalidUserCredentialsMessage,
  invalidTokenMessage,
  generalErrorMessage,
} from '~/services/error';
import { version } from '/root/package.json';

import { callWithBackoff, callWithBackoffOptions } from './callWithBackoff';

export type DownloadRecordsResponse = {
  count: number;
  cursor: string;
  records: SyncRecord[];
};

export type UploadRecordsResponse = {
  count: number;
  requestedAt: number;
};

type ChannelWithSyncCursor = {
  channel: string;
  cursor?: string;
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
  localisation: object;
  permissions: [];
}

export interface SyncSource {
  fetchChannelsWithChanges(
    channels: ChannelWithSyncCursor[],
  ): Promise<string[]>;

  downloadRecords(
    channel: string,
    since: string,
    limit: number,
    { noCount: boolean },
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

const fetchWithTimeout = async (url: string, config?: object): Promise<Response> => {
  const { cleanup, promise: timeoutPromise } = createTimeoutPromise();
  try {
    const response = await Promise.race([fetch(url, config), timeoutPromise]);
    // assert type because timeoutPromise is guaranteed not to resolve unless cleaned up
    return (response as Response);
  } finally {
    cleanup();
  }
};

const getResponseJsonSafely = async (response: Response): Promise<Record<string, any>> => {
  try {
    return response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    console.error(e);
    return {};
  }
};

type FetchOptions = {
  backoff?: callWithBackoffOptions;
  [key: string]: any;
};

export class WebSyncSource implements SyncSource {
  host: string;

  token: string | null;

  emitter = mitt();

  connect(host: string): void {
    this.host = host;
  }

  async fetch(
    path: string,
    query: Record<string, string>,
    { backoff, ...config }: FetchOptions = {},
  ) {
    if (!this.host) {
      throw new AuthenticationError('WebSyncSource.fetch: not connected to a host yet');
    }
    const queryString = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
    const url = `${this.host}/v${API_VERSION}/${path}?${queryString}`;
    const extraHeaders = config?.headers || {};
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/json',
      'X-Tamanu-Client': 'Tamanu Mobile',
      'X-Version': version,
      ...extraHeaders,
    };
    const response = await callWithBackoff(
      () => fetchWithTimeout(url, {
        ...config,
        headers,
      }),
      backoff,
    );

    if (response.status === 401) {
      throw new AuthenticationError(path.includes('/login') ? invalidTokenMessage : invalidUserCredentialsMessage);
    }

    if (response.status === 400) {
      const { error } = await getResponseJsonSafely(response);
      if (error?.name === 'InvalidClientVersion') {
        throw new OutdatedVersionError(error.updateUrl);
      }
    }

    if (response.status === 422) {
      const { error } = await getResponseJsonSafely(response);
      throw new Error(error.message);
    }

    if (!response.ok) {
      // User will be shown a generic error message;
      // log it out here to help with debugging
      console.error("Response had non-OK value", { url, response });
      throw new Error(generalErrorMessage);
    }

    return response.json();
  }

  async get(path: string, query: Record<string, string>) {
    return this.fetch(path, query, { method: 'GET' });
  }

  async post(path: string, query: Record<string, string>, body, options?: FetchOptions) {
    return this.fetch(path, query, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  throwError(err: Error) {
    // emit error after throwing
    setTimeout(() => {
      this.emitter.emit('error', err);
    }, 1);
    throw err;
  }

  async fetchChannelsWithChanges(channelsToCheck: ChannelWithSyncCursor[]): Promise<string[]> {
    try {
      const batchSize = 1000; // pretty arbitrary, avoid overwhelming the server with e.g. 100k channels
      const channelsWithPendingChanges = [];
      for (const batchOfChannels of chunk(channelsToCheck, batchSize)) {
        const body = batchOfChannels.reduce((acc, { channel, cursor = '0' }) => ({
          ...acc,
          [channel]: cursor,
        }), {});
        const { channelsWithChanges } = await this.post('sync/channels', {}, body, { backoff: { maxAttempts: 3 } }); // TODO: load from localisation?
        channelsWithPendingChanges.push(...channelsWithChanges);
      }
      return channelsWithPendingChanges;
    } catch (err) {
      this.throwError(err);
    }
  }

  async downloadRecords(
    channel: string,
    since: string,
    limit: number,
    { noCount = false } = {},
  ): Promise<DownloadRecordsResponse | null> {
    try {
      // TODO: error handling (incl timeout & token revokation)
      const query = {
        since,
        limit: limit.toString(),
        noCount: noCount.toString(),
      };
      const path = `sync/${encodeURIComponent(channel)}`;

      const response = await this.get(path, query);
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
      const response = await this.post(path, {}, records);
      return response;
    } catch (err) {
      this.throwError(err);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const data = await this.post('login', {}, { email, password }, { backoff: { maxAttempts: 1 } });

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
