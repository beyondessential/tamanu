import qs from 'qs';
import { decodeJwt } from 'jose/jwt/decode';

import { SERVER_TYPES, SYNC_STREAM_MESSAGE_KIND, DeviceScope } from '@tamanu/constants';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';

import {
  ERROR_TYPE,
  Problem,
  extractErrorFromFetchResponse,
  RemoteIncompatibleError,
  RemoteCallError,
} from '@tamanu/errors';
import { BaseFetchOptions, fetchOrThrowIfUnavailable } from './fetch';
import { fetchWithRetryBackoff, RetryBackoffOptions } from './fetchWithRetryBackoff';
import {
  InterceptorManager,
  type Interceptor,
  type RequestInterceptorFulfilled,
  type RequestInterceptorRejected,
  type ResponseInterceptorFulfilled,
  type ResponseInterceptorRejected,
} from './InterceptorManager';
import { getVersionIncompatibleMessage } from './getVersionIncompatibleMessage';

interface Logger {
  debug: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  log: (message: string, data?: any) => void;
}

export type LoggerType = Logger | Console;

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface LoginData {
  token: string;
  refreshToken: string;
  permissions?: string[];
}

interface LoginResponse extends LoginData {
  user: User;
  ability: {
    can: (action: string, subject: string, field?: string) => boolean;
  };
  server: ServerInfo;
}

interface ServerInfo {
  type: string;
  centralHost?: string;
}

interface TamanuApiConfig {
  endpoint: string;
  agentName: string;
  agentVersion: string;
  deviceId: string;
  defaultRequestConfig?: RequestInit;
  logger?: LoggerType;
}

interface FetchOptions extends BaseFetchOptions {
  useAuthToken?: string | boolean;
  returnResponse?: boolean;
  throwResponse?: boolean;
  waitForAuth?: boolean;
  backoff?: boolean | RetryBackoffOptions;
  scopes?: DeviceScope[];
  body?: any;
}

interface PasswordChangeArgs {
  currentPassword: string;
  newPassword: string;
}

interface StreamEndpointConfig {
  endpoint: string;
  query?: Record<string, any>;
  options?: Record<string, any>;
}

interface StreamOptions {
  decodeMessage?: boolean;
  streamRetryAttempts?: number;
  streamRetryInterval?: number;
}

interface StreamMessage {
  kind: number;
  message: any;
}

interface DecodeResult {
  buf: Buffer;
  length?: number;
  kind?: number;
  message?: any;
}

interface LoginResponseData {
  token: string;
  refreshToken: string;
  permissions?: string[];
  server?: {
    type: string;
    centralHost?: string;
  };
  centralHost?: string;
  serverType?: string;
}

export class TamanuApi {
  #host: string;
  #prefix: string;
  #defaultRequestConfig: RequestInit = {};

  #onAuthFailure?: (message: string) => void;
  #onVersionIncompatible?: (message: string) => void;
  #authToken?: string;
  #refreshToken?: string;
  #ongoingAuth?: Promise<LoginResponse> | null;

  lastRefreshed: number | null = null;
  user: User | null = null;
  logger: LoggerType = console;
  fetchImplementation: typeof fetch = fetch;
  agentName: string;
  agentVersion: string;
  deviceId: string;
  interceptors: {
    request: InterceptorManager<RequestInterceptorFulfilled, RequestInterceptorRejected>;
    response: InterceptorManager<ResponseInterceptorFulfilled, ResponseInterceptorRejected>;
  };

  constructor({
    endpoint,
    agentName,
    agentVersion,
    deviceId,
    defaultRequestConfig = {},
    logger,
  }: TamanuApiConfig) {
    this.#prefix = endpoint;
    const endpointUrl = new URL(endpoint);
    this.#host = endpointUrl.origin;
    this.#defaultRequestConfig = defaultRequestConfig;

    this.agentName = agentName;
    this.agentVersion = agentVersion;
    this.deviceId = deviceId;
    this.interceptors = {
      request: new InterceptorManager<RequestInterceptorFulfilled, RequestInterceptorRejected>(),
      response: new InterceptorManager<ResponseInterceptorFulfilled, ResponseInterceptorRejected>(),
    };
    if (logger) {
      this.logger = logger;
    }
  }

  get host(): string {
    return this.#host;
  }

  setAuthFailureHandler(handler: (message: string) => void): void {
    this.#onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler: (message: string) => void): void {
    this.#onVersionIncompatible = handler;
  }

  async login(email: string, password: string, config: FetchOptions = {}): Promise<LoginResponse> {
    const { scopes = [], body = {}, ...restOfConfig } = config;
    if (this.#ongoingAuth) {
      return await this.#ongoingAuth;
    }

    return await (this.#ongoingAuth = (async (): Promise<LoginResponse> => {
      const response = (await this.post(
        'login',
        {
          email,
          password,
          deviceId: this.deviceId,
          scopes,
          ...body,
        },
        { ...restOfConfig, returnResponse: true, useAuthToken: false, waitForAuth: false },
      )) as Response;

      const serverType = response.headers.get('x-tamanu-server');
      if (!(SERVER_TYPES.FACILITY === serverType || SERVER_TYPES.CENTRAL === serverType)) {
        throw Problem.fromError(
          new RemoteIncompatibleError(`Tamanu server type '${serverType}' is not supported`),
        ).withResponse(response);
      }

      const responseData = (await response.json()) as LoginResponseData;
      const {
        server: serverFromResponse,
        centralHost,
        serverType: responseServerType,
        ...loginData
      } = responseData;

      const claims = decodeJwt(loginData.token);
      if (claims.deviceId !== this.deviceId) {
        // If this happens, either something is seriously wrong or the server has a bug.
        throw Problem.fromError(
          new RemoteCallError('Device ID mismatch').withExtraData({
            deviceIdSent: this.deviceId,
            deviceIdRecv: claims.deviceId,
          }),
        ).withResponse(response);
      }

      const server = serverFromResponse ?? { type: '', centralHost: undefined };
      server.type = responseServerType ?? serverType;
      server.centralHost = centralHost;
      this.setToken(loginData.token, loginData.refreshToken);

      const { user, ability } = await this.fetchUserData(loginData.permissions ?? [], restOfConfig);
      return { ...loginData, user, ability, server };
    })().finally(() => {
      this.#ongoingAuth = null;
    }));
  }

  async fetchUserData(
    permissions: string[],
    config: FetchOptions = {},
  ): Promise<{ user: User; ability: any }> {
    const user = (await this.get('user/me', {}, { ...config, waitForAuth: false })) as User;
    this.lastRefreshed = Date.now();
    this.user = user;

    const ability = buildAbilityForUser(user, permissions);
    return { user, ability };
  }

  async requestPasswordReset(email: string): Promise<any> {
    return this.post('resetPassword', { email, deviceId: this.deviceId });
  }

  async changePassword(args: PasswordChangeArgs): Promise<any> {
    return this.post('changePassword', args);
  }

  async refreshToken(config: FetchOptions = {}): Promise<void> {
    if (!this.#refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = (await this.post(
      'refresh',
      {
        deviceId: this.deviceId,
        refreshToken: this.#refreshToken,
      },
      { ...config, useAuthToken: false, waitForAuth: false },
    )) as { token: string; refreshToken: string };

    const { token, refreshToken } = response;
    this.setToken(token, refreshToken);
  }

  setToken(token: string, refreshToken: string | null = null): void {
    this.#authToken = token;
    this.#refreshToken = refreshToken || undefined;
  }

  hasToken(): boolean {
    return Boolean(this.#authToken);
  }

  async fetch(
    endpoint: string,
    query: Record<string, any> = {},
    options: FetchOptions = {},
  ): Promise<any> {
    const { useAuthToken, ...moreConfig } = {
      ...this.#defaultRequestConfig,
      ...options,
    };
    let authToken = useAuthToken ?? this.#authToken;
    const {
      headers,
      returnResponse = false,
      throwResponse = false,
      waitForAuth = true,
      backoff = false,
      ...otherConfig
    } = moreConfig;

    if (waitForAuth && this.#ongoingAuth) {
      await this.#ongoingAuth;
      if (useAuthToken !== false) {
        // use the auth token from after the pending login
        authToken = this.#authToken;
      }
    }

    let fetcher = fetchOrThrowIfUnavailable;
    if (backoff) {
      const backoffOptions = typeof backoff === 'object' ? backoff : {};
      fetcher = (url: string, config: any) =>
        fetchWithRetryBackoff(url, config, { ...backoffOptions, log: this.logger });
    }

    const reqHeaders = new Headers({
      accept: 'application/json',
      'x-tamanu-client': this.agentName,
      'x-version': this.agentVersion,
    });

    if (otherConfig.body) {
      reqHeaders.set('content-type', 'application/json');
    }

    if (authToken) {
      reqHeaders.set('authorization', `Bearer ${authToken}`);
    }

    for (const [key, value] of Object.entries(headers ?? {})) {
      const name = key.toLowerCase();
      if (['authorization', 'x-tamanu-client', 'x-version'].includes(name)) continue;
      reqHeaders.set(name, value as string);
    }

    const queryString = qs.stringify(query || {});
    const path = `${endpoint}${queryString ? `?${queryString}` : ''}`;
    const url = `${this.#prefix}/${path}`;
    const config = {
      headers: reqHeaders,
      ...otherConfig,
    };

    // For fetch we have to explicitly remove the content-type header
    // to allow the browser to add the boundary value
    if (config.body instanceof FormData) {
      config.headers.delete('content-type');
    }

    if (
      config.body &&
      config.headers.get('content-type')?.startsWith('application/json') &&
      !(config.body instanceof Uint8Array) // also covers Buffer
    ) {
      config.body = JSON.stringify(config.body);
    }

    const requestInterceptorChain: Array<RequestInterceptorFulfilled | RequestInterceptorRejected> =
      [];
    // request: first in last out
    this.interceptors.request.forEach(function unshiftRequestInterceptors(
      interceptor: Interceptor<RequestInterceptorFulfilled, RequestInterceptorRejected>,
    ) {
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    let requestPromise = Promise.resolve(config);
    let i = 0;
    while (i < requestInterceptorChain.length) {
      const fulfilled = requestInterceptorChain[i++] as RequestInterceptorFulfilled;
      const rejected = requestInterceptorChain[i++] as RequestInterceptorRejected;
      requestPromise = requestPromise.then(fulfilled, rejected);
    }
    const latestConfig = await requestPromise;

    const response = await fetcher(url, {
      fetch: this.fetchImplementation,
      ...latestConfig,
    } as FetchOptions);

    // Fixed response interceptor chain handling
    const responseInterceptorChain: Array<
      ResponseInterceptorFulfilled | ResponseInterceptorRejected
    > = [];
    // response: first in first out
    this.interceptors.response.forEach(function pushResponseInterceptors(
      interceptor: Interceptor<ResponseInterceptorFulfilled, ResponseInterceptorRejected>,
    ) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let responsePromise = response.ok ? Promise.resolve(response) : Promise.reject(response);
    let j = 0;
    while (j < responseInterceptorChain.length) {
      const fulfilled = responseInterceptorChain[j++] as ResponseInterceptorFulfilled;
      const rejected = responseInterceptorChain[j++] as ResponseInterceptorRejected;
      responsePromise = responsePromise.then(fulfilled, rejected);
    }

    await responsePromise.catch(() => {});

    if (response.ok) {
      if (returnResponse) {
        return response;
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    }

    if (throwResponse) {
      throw response;
    }

    const problem = await extractErrorFromFetchResponse(response, url, this.logger);

    if (problem.type.startsWith(ERROR_TYPE.AUTH)) {
      this.#onAuthFailure?.(problem.detail);
    }

    if (problem.type === ERROR_TYPE.CLIENT_INCOMPATIBLE) {
      const versionIncompatibleMessage = getVersionIncompatibleMessage(problem);
      if (versionIncompatibleMessage) {
        this.#onVersionIncompatible?.(versionIncompatibleMessage);
      }
    }

    throw problem;
  }

  async get<T = any>(
    endpoint: string,
    query: Record<string, any> = {},
    config: FetchOptions = {},
  ): Promise<T> {
    return this.fetch(endpoint, query, { ...config, method: 'GET' });
  }

  async download(endpoint: string, query: Record<string, any> = {}): Promise<Blob> {
    const response = (await this.fetch(endpoint, query, {
      returnResponse: true,
    })) as Response;
    const blob = await response.blob();
    return blob;
  }

  async postWithFileUpload(
    endpoint: string,
    file: Blob,
    body: any,
    options: FetchOptions = {},
  ): Promise<any> {
    const blob = new Blob([file]);

    // We have to use multipart/formdata to support sending the file data,
    // but sending the other fields in that format loses type information
    // (for eg, sending a value of false will arrive as the string "false")
    // So, we just piggyback a json string over the multipart format, and
    // parse that on the backend.
    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(body));
    formData.append('file', blob);

    return this.fetch(endpoint, undefined, {
      method: 'POST',
      body: formData,
      ...options,
    });
  }

  async post<T = any>(
    endpoint: string,
    body: any = undefined,
    config: FetchOptions = {},
  ): Promise<T> {
    return this.fetch(
      endpoint,
      {},
      {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        ...config,
        method: 'POST',
      },
    );
  }

  async put<T = any>(
    endpoint: string,
    body: any = undefined,
    config: FetchOptions = {},
  ): Promise<T> {
    return this.fetch(
      endpoint,
      {},
      {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        ...config,
        method: 'PUT',
      },
    );
  }

  async delete<T = any>(
    endpoint: string,
    query: Record<string, any> = {},
    config: FetchOptions = {},
  ): Promise<T> {
    return this.fetch(endpoint, query, { ...config, method: 'DELETE' });
  }

  async pollUntilOk<T = any>(
    endpoint: string,
    query?: Record<string, any>,
    config?: FetchOptions,
  ): Promise<T> {
    const waitTime = 1000; // retry once per second
    const maxAttempts = 60 * 60 * 12; // for a maximum of 12 hours
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await this.fetch(endpoint, query, config);
      if (response) {
        return response;
      }

      await new Promise<void>(resolve => {
        setTimeout(resolve, waitTime);
      });
    }

    throw new Error(`Poll of ${endpoint} did not succeed after ${maxAttempts} attempts`);
  }

  /** Connect to a streaming endpoint and async yield messages.
   *
   * ```js
   * for await (const { kind, message } of centralServer.stream(() => ({
   *   endpoint: `some/kind/of/stream`,
   * }))) {
   *   switch (kind) {
   *     case SYNC_STREAM_MESSAGE_KIND.SOMETHING:
   *       // do something
   *       break;
   *     case: SYNC_STREAM_MESSAGE_KIND.END:
   *       // finalise
   *       break;
   *     default:
   *       console.warn(`Unknown message kind: ${kind}`);
   *   }
   * }
   * ```
   *
   * The streaming endpoint needs to talk the Tamanu Streaming Protocol: a lightweight framing
   * protocol which includes a 2-byte Message Kind (unsigned int) and an optional JSON payload.
   * The stream MUST end with an `END` Message Kind (which may have a payload): if the stream
   * does not receive an `END` message, it is assumed to be incomplete and is automatically
   * restarted; this protects against unexpected stream disconnections.
   *
   * There are two possible layers of retry logic: on connection, using the endpointFn `options`
   * map, you can set `backoff` to retry the fetch on initial failure. This applies on top of the
   * stream retries, controlled by `streamRetryAttempts` (default 10) and `streamRetryInterval`
   * (milliseconds, default 10 seconds), which will restart the entire stream if it fails early.
   * Set `streamRetryAttempts` to 1 to disable the retries.
   *
   * Because the entire stream is restarted during a stream retry, the endpoint is not a fixed URL
   * but instead a function which is expected to return an object: `{ endpoint, query, options }`.
   * The `endpoint` key is required, the others default to `{}` if not present. These are passed to
   * and interpreted the same as for `.fetch()` above.
   *
   * For example, you can track some progress information from the messages you receive, and then
   * provide a "start from this point" query parameter to the next retry call. This avoids either
   * receiving the full stream contents again or keeping track of stream session state server-side.
   *
   * Message payloads are expected to be JSON, and by default are parsed directly within this
   * function. If you expect non-JSON payloads, or if you want to obtain the raw payload for some
   * other reason, pass `decodeMessage: false`. This will be slightly faster as the framing allows
   * us to seek forward through the received data rather than read every byte.
   *
   * @param endpointFn Function that returns endpoint configuration
   * @param streamOptions Stream configuration options
   * @returns AsyncGenerator yielding stream messages
   */
  async *stream(
    endpointFn: () => StreamEndpointConfig,
    {
      decodeMessage = true,
      streamRetryAttempts = 10,
      streamRetryInterval = 10000,
    }: StreamOptions = {},
  ): AsyncGenerator<StreamMessage, void, unknown> {
    // +---------+---------+---------+----------------+
    // |  CR+LF  |   kind  |  length |     data...    |
    // +---------+---------+---------+----------------+
    // | 2 bytes | 2 bytes | 4 bytes | $length$ bytes |
    // +---------+---------+---------+----------------+
    //
    // This framing makes it cheap to verify that all the data is here,
    // and also doesn't *require* us to parse any of the message data.
    // The first two bytes are a CR+LF (a newline), which makes it possible
    // to curl an endpoint and get (almost) newline-delimited JSON which
    // will print nicely in a terminal.
    const decodeOne = (buffer: Buffer): DecodeResult => {
      if (buffer.length < 8) {
        return { buf: buffer };
      }

      // skip reading the first two bytes. we could check that they
      // are CR+LF but that's not really needed, and leaves us some
      // leeway later if we want to put more stuff in those bytes.
      const kind = buffer.readUInt16BE(2);
      const length = buffer.readUInt32BE(4);
      const data = buffer.subarray(8, 8 + length);

      if (data.length < length) {
        return { buf: buffer, kind };
      }

      // we've got the full message, move it out of buffer
      buffer = buffer.subarray(8 + length);

      this.logger.debug('Stream: message', {
        // we try to show the actual name of the Kind when known instead of the raw value
        // we also display the raw value in hex as that's how they're defined in constants
        kind:
          Object.entries(SYNC_STREAM_MESSAGE_KIND).find(([, value]) => value === kind)?.[0] ??
          `0x${kind.toString(16)}`,
        length,
        data,
      });

      if (decodeMessage) {
        // message is assumed to be an empty object when length is zero,
        // such that it can generally be assumed that message is an object
        // (though that will depend on stream endpoint application)
        const message = length > 0 ? JSON.parse(data.toString()) : {};
        return { buf: buffer, length, kind, message };
      } else {
        return { buf: buffer, length, kind, message: data };
      }
    };

    let { endpoint, query, options } = endpointFn();
    for (let attempt = 1; attempt <= streamRetryAttempts; attempt++) {
      this.logger.debug(`Stream: attempt ${attempt} of ${streamRetryAttempts} for ${endpoint}`);
      const response = (await this.fetch(endpoint, query, {
        ...options,
        returnResponse: true,
      })) as Response;

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();

      // buffer used to accumulate the data received from the stream.
      // it's important to remember that there's no guarantee that a
      // message sent from the server is received in one go by the
      // client: the transport could fragment messages at arbitrary
      // boundaries, or could concatenate messages together.
      let buffer = Buffer.alloc(0);
      reader: while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer = Buffer.concat([buffer, value]);
        }

        // while not strictly required, for clarity we label both reader
        // and decoder loops and always use the right label to break out
        decoder: while (true) {
          const { buf, length, kind, message } = decodeOne(buffer);
          buffer = buf;
          if (length === undefined) {
            // not enough data, wait for more
            break decoder;
          }

          yield { kind: kind!, message };

          if (kind === SYNC_STREAM_MESSAGE_KIND.END) {
            return; // stop processing data
            // technically we could also abort the fetch at this point,
            // but for now let's assume stream endpoints are well-behaved
            // and are closing the stream immediately after sending END
          }
        }

        // when the stream is done we need to keep decoding what's in our buffer
        if (done) {
          const { length, kind, message } = decodeOne(buffer);

          if (!kind) {
            this.logger.warn('Stream ended with incomplete data, will retry');
            break reader;
          }

          if (length === undefined && kind === SYNC_STREAM_MESSAGE_KIND.END) {
            // if the data is not complete, don't interpret the END message as being truly the end
            this.logger.warn('END message received but with partial data, will retry');
            break reader;
          }

          yield { kind, message };

          if (kind === SYNC_STREAM_MESSAGE_KIND.END) {
            return; // skip retry logic
          }

          break reader;
        }
      }

      // this is sleepAsync but it's simple enough to implement ourselves
      // instead of adding a whole dependency on @tamanu/shared just for it
      await new Promise<void>(resolve => {
        setTimeout(resolve, streamRetryInterval);
      });

      ({ endpoint, query, options } = endpointFn());
      if (!endpoint) {
        // expected to only be a developer error
        throw new Error(`Stream: endpoint became undefined`);
      }
    }

    // all "happy path" endings are explicit returns,
    // so if we fall through we are in the error path
    throw new Error(
      `Stream: did not get proper END after ${streamRetryAttempts} attempts for ${endpoint}`,
    );
  }
}
