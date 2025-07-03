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

  getHost() {
    return this.#host;
  }

  setAuthFailureHandler(handler) {
    this.#onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler) {
    this.#onVersionIncompatible = handler;
  }

  async login(email, password, config = {}) {
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
        },
        { ...config, returnResponse: true, useAuthToken: false, waitForAuth: false },
      );
      const serverType = response.headers.get('X-Tamanu-Server');
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

      const { user, ability } = await this.fetchUserData(loginData.permissions, config);
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

  async refreshToken() {
    if (!this.#refreshToken && !this.#authToken) return;

    try {
      const response = await this.post(
        'refresh',
        {},
        { useAuthToken: this.#refreshToken ?? this.#authToken, waitForAuth: false },
      );
      const { token, refreshToken } = response;
      this.setToken(token, refreshToken);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  setToken(token, refreshToken = null) {
    this.#authToken = token;
    this.#refreshToken = refreshToken;
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

    const queryString = qs.stringify(query || {});
    const path = `${endpoint}${queryString ? `?${queryString}` : ''}`;
    const url = `${this.#prefix}/${path}`;
    const config = {
      headers: {
        Accept: 'application/json',
        'Content-Type': otherConfig.body ? 'application/json' : undefined,
        ...headers,
        ...(useAuthToken ? { Authorization: `Bearer ${useAuthToken}` } : {}),
        'X-Tamanu-Client': this.agentName,
        'X-Version': this.agentVersion,
      },
      ...otherConfig,
    };

    if (
      config.body &&
      config.headers['Content-Type']?.startsWith('application/json') &&
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

    const response = await fetcher(url, latestConfig);

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

    // handle auth invalid
    if (response.status === 401 && endpoint === 'login') {
      const message =
        (await response.json().then(
          json => json.message,
          () => null,
        )) ?? 'Failed authentication';
      if (this.#onAuthFailure) {
        this.#onAuthFailure(message);
      }
      throw new AuthInvalidError(message, response);
    }

    // handle forbidden error
    if (response.status === 403 && error) {
      throw new ForbiddenError(message, response);
    }

    if (response.status === 404) {
      throw new NotFoundError(message, response);
    }

    // handle auth expiring
    if (response.status === 401 && endpoint !== 'login' && this.#onAuthFailure) {
      const message = 'Your session has expired. Please log in again.';
      this.#onAuthFailure(message);
      throw new AuthExpiredError(message, response);
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
        body: body && JSON.stringify(body),
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
        body: body && JSON.stringify(body),
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
