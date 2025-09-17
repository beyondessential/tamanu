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

export class TamanuApi {
  #host;
  #prefix;
  #defaultRequestConfig = {};

  #onAuthFailure;
  #onVersionIncompatible;
  #authToken;
  #refreshToken;
  #ongoingAuth;

  lastRefreshed = null;
  user = null;
  logger = console;
  fetchImplementation = fetch;

  constructor({ endpoint, agentName, agentVersion, deviceId, defaultRequestConfig = {}, logger }) {
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

  get host() {
    return this.#host;
  }

  setAuthFailureHandler(handler) {
    this.#onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler) {
    this.#onVersionIncompatible = handler;
  }

  async login(email, password, { scopes = [], ...config } = {}) {
    if (this.#ongoingAuth) {
      await this.#ongoingAuth;
    }

    return (this.#ongoingAuth = (async () => {
      const response = await this.post(
        'login',
        {
          email,
          password,
          deviceId: this.deviceId,
          scopes,
        },
        { ...config, returnResponse: true, useAuthToken: false, waitForAuth: false },
      );

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

  async fetchUserData(permissions, config = {}) {
    const user = await this.get('user/me', {}, { ...config, waitForAuth: false });
    this.lastRefreshed = Date.now();
    this.user = user;

    const ability = buildAbilityForUser(user, permissions);
    return { user, ability };
  }

  async requestPasswordReset(email) {
    return this.post('resetPassword', { email });
  }

  async changePassword(args) {
    return this.post('changePassword', args);
  }

  async refreshToken(config = {}) {
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
    );
    const { token, refreshToken } = response;
    this.setToken(token, refreshToken);
  }

  setToken(token, refreshToken = null) {
    this.#authToken = token;
    this.#refreshToken = refreshToken;
  }

  hasToken() {
    return Boolean(this.#authToken);
  }

  async fetch(endpoint, query = {}, options = {}) {
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
      fetcher = (url, config) =>
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
      reqHeaders.set(name, value);
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

    const requestInterceptorChain = [];
    // request: first in last out
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
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

    const responseInterceptorChain = [];
    // response: first in first out
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
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
  async extractError(endpoint, response) {
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

  async get(endpoint, query = {}, config = {}) {
    return this.fetch(endpoint, query, { ...config, method: 'GET' });
  }

  async download(endpoint, query = {}) {
    const response = await this.fetch(endpoint, query, {
      returnResponse: true,
    });
    const blob = await response.blob();
    return blob;
  }

  async postWithFileUpload(endpoint, file, body, options = {}) {
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

  async post(endpoint, body = undefined, config = {}) {
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

  async put(endpoint, body = undefined, config = {}) {
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

  async delete(endpoint, query = {}, config = {}) {
    return this.fetch(endpoint, query, { ...config, method: 'DELETE' });
  }

  async pollUntilOk(...args) {
    const waitTime = 1000; // retry once per second
    const maxAttempts = 60 * 60 * 12; // for a maximum of 12 hours
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await this.fetch(...args);
      if (response) {
        return response;
      }

      await new Promise(resolve => {
        setTimeout(resolve, waitTime);
      });
    }

    throw new Error(`Poll of ${args[0]} did not succeed after ${maxAttempts} attempts`);
  }
}
