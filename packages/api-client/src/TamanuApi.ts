import qs from 'qs';

import { SERVER_TYPES } from '@tamanu/constants';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';

import {
  AuthExpiredError,
  AuthInvalidError,
  ForbiddenError,
  NotFoundError,
  ResourceConflictError,
  ServerResponseError,
  VersionIncompatibleError,
  getVersionIncompatibleMessage,
} from './errors';
import { fetchOrThrowIfUnavailable, getResponseErrorSafely } from './fetch';
import { fetchWithRetryBackoff } from './fetchWithRetryBackoff';
import { InterceptorManager } from './InterceptorManager';

// Type definitions
interface User {
  id: string;
  email: string;
  displayName: string;
  // Add other user properties as needed
}

interface LoginData {
  token: string;
  refreshToken: string;
  permissions?: string[];
}

interface LoginResponse extends LoginData {
  user: User;
  ability: any; // Type this based on your ability system
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
  logger?: Logger;
}

interface Logger {
  log: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
}

interface FetchOptions extends RequestInit {
  useAuthToken?: string | boolean;
  returnResponse?: boolean;
  throwResponse?: boolean;
  waitForAuth?: boolean;
  backoff?: boolean | BackoffOptions;
}

interface BackoffOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
}

interface PasswordChangeArgs {
  currentPassword: string;
  newPassword: string;
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
  logger: Logger = console;
  fetchImplementation: typeof fetch = fetch;
  agentName: string;
  agentVersion: string;
  deviceId: string;
  interceptors: {
    request: InterceptorManager;
    response: InterceptorManager;
  };

  constructor({ endpoint, agentName, agentVersion, deviceId, defaultRequestConfig = {}, logger }: TamanuApiConfig) {
    this.#prefix = endpoint;
    const endpointUrl = new URL(endpoint);
    this.#host = endpointUrl.origin;
    this.#defaultRequestConfig = defaultRequestConfig;

    this.agentName = agentName;
    this.agentVersion = agentVersion;
    this.deviceId = deviceId;
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
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
    if (this.#ongoingAuth) {
      await this.#ongoingAuth;
    }

    return (this.#ongoingAuth = (async (): Promise<LoginResponse> => {
      const response = await this.post(
        'login',
        {
          email,
          password,
          deviceId: this.deviceId,
        },
        { ...config, returnResponse: true, useAuthToken: false, waitForAuth: false },
      ) as Response;

      const serverType = response.headers.get('x-tamanu-server');
      if (![SERVER_TYPES.FACILITY, SERVER_TYPES.CENTRAL].includes(serverType)) {
        throw new ServerResponseError(
          `Tamanu server type '${serverType}' is not supported.`,
          response,
        );
      }

      const {
        server = {},
        centralHost,
        serverType: responseServerType,
        ...loginData
      } = await response.json();

      server.type = responseServerType ?? serverType;
      server.centralHost = centralHost;
      this.setToken(loginData.token, loginData.refreshToken);

      const { user, ability } = await this.fetchUserData(loginData.permissions ?? [], config);
      return { ...loginData, user, ability, server };
    })().finally(() => {
      this.#ongoingAuth = null;
    }));
  }

  async fetchUserData(permissions: string[], config: FetchOptions = {}): Promise<{ user: User; ability: any }> {
    const user = await this.get('user/me', {}, { ...config, waitForAuth: false }) as User;
    this.lastRefreshed = Date.now();
    this.user = user;

    const ability = buildAbilityForUser(user, permissions);
    return { user, ability };
  }

  async requestPasswordReset(email: string): Promise<any> {
    return this.post('resetPassword', { email });
  }

  async changePassword(args: PasswordChangeArgs): Promise<any> {
    return this.post('changePassword', args);
  }

  async refreshToken(config: FetchOptions = {}): Promise<void> {
    if (!this.#refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post(
      'refresh',
      {
        deviceId: this.deviceId,
        refreshToken: this.#refreshToken,
      },
      { ...config, useAuthToken: false, waitForAuth: false },
    ) as { token: string; refreshToken: string };
    
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

  async fetch(endpoint: string, query: Record<string, any> = {}, options: FetchOptions = {}): Promise<any> {
    let { useAuthToken = this.#authToken, ...moreConfig } = {
      ...this.#defaultRequestConfig,
      ...options,
    };
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
        useAuthToken = this.#authToken;
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
    
    if (useAuthToken) {
      reqHeaders.set('authorization', `Bearer ${useAuthToken}`);
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

    const requestInterceptorChain: any[] = [];
    // request: first in last out
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor: any) {
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    let i = 0;
    let requestPromise = Promise.resolve(config);
    while (i < requestInterceptorChain.length) {
      requestPromise = requestPromise.then(
        requestInterceptorChain[i++],
        requestInterceptorChain[i++],
      );
    }
    const latestConfig = await requestPromise;

    const response = await fetcher(url, { fetch: this.fetchImplementation, ...latestConfig });

    const responseInterceptorChain: any[] = [];
    // response: first in first out
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor: any) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let j = 0;
    let responsePromise = response.ok ? Promise.resolve(response) : Promise.reject(response);
    while (j < responseInterceptorChain.length) {
      responsePromise = responsePromise.then(
        responseInterceptorChain[j++],
        responseInterceptorChain[j++],
      );
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

    return this.extractError(endpoint, response);
  }

  /**
   * Handle errors from the server response.
   *
   * Generally only used internally.
   */
  async extractError(endpoint: string, response: Response): Promise<never> {
    const { error } = await getResponseErrorSafely(response, this.logger);
    const message = error?.message || response.status.toString();

    if (response.status === 403 && error) {
      throw new ForbiddenError(message, response);
    }

    if (response.status === 404) {
      throw new NotFoundError(message, response);
    }

    if (response.status === 401) {
      const errorMessage = error?.message || 'Failed authentication';
      if (this.#onAuthFailure) {
        this.#onAuthFailure(errorMessage);
      }
      throw new (endpoint === 'login' ? AuthInvalidError : AuthExpiredError)(
        errorMessage,
        response,
      );
    }

    // handle version incompatibility
    if (response.status === 400 && error) {
      const versionIncompatibleMessage = getVersionIncompatibleMessage(error, response);
      if (versionIncompatibleMessage) {
        if (this.#onVersionIncompatible) {
          this.#onVersionIncompatible(versionIncompatibleMessage);
        }
        throw new VersionIncompatibleError(versionIncompatibleMessage, response);
      }
    }

    // Handle resource conflict
    if (response.status === 409) {
      throw new ResourceConflictError(message, response);
    }

    throw new ServerResponseError(`Server error response: ${message}`, response);
  }

  async get<T = any>(endpoint: string, query: Record<string, any> = {}, config: FetchOptions = {}): Promise<T> {
    return this.fetch(endpoint, query, { ...config, method: 'GET' });
  }

  async download(endpoint: string, query: Record<string, any> = {}): Promise<Blob> {
    const response = await this.fetch(endpoint, query, {
      returnResponse: true,
    }) as Response;
    const blob = await response.blob();
    return blob;
  }

  async postWithFileUpload(endpoint: string, file: File | Blob, body: any, options: FetchOptions = {}): Promise<any> {
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

  async post<T = any>(endpoint: string, body: any = undefined, config: FetchOptions = {}): Promise<T> {
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

  async put<T = any>(endpoint: string, body: any = undefined, config: FetchOptions = {}): Promise<T> {
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

  async delete<T = any>(endpoint: string, query: Record<string, any> = {}, config: FetchOptions = {}): Promise<T> {
    return this.fetch(endpoint, query, { ...config, method: 'DELETE' });
  }

  async pollUntilOk<T = any>(endpoint: string, query?: Record<string, any>, config?: FetchOptions): Promise<T> {
    const waitTime = 1000; // retry once per second
    const maxAttempts = 60 * 60 * 12; // for a maximum of 12 hours
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await this.fetch(endpoint, query, config);
      if (response) {
        return response;
      }

      await new Promise(resolve => {
        setTimeout(resolve, waitTime);
      });
    }

    throw new Error(`Poll of ${endpoint} did not succeed after ${maxAttempts} attempts`);
  }
}