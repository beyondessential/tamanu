import qs from 'qs';

import { SERVER_TYPES } from '@tamanu/constants';
import { NotFoundError, ForbiddenError } from '@tamanu/shared/errors';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';

import {
  AuthExpiredError,
  ServerResponseError,
  VersionIncompatibleError,
  getVersionIncompatibleMessage,
} from './errors';
import { fetchOrThrowIfUnavailable, getResponseErrorSafely } from './fetch';

export class TamanuApi {
  #host;
  #prefix;

  #onAuthFailure;
  #onVersionIncompatible;
  #authHeader;

  lastRefreshed = null;
  user = null;

  constructor({ endpoint, agentName, agentVersion, deviceId }) {
    this.#prefix = endpoint;
    const endpointUrl = new URL(endpoint);
    this.#host = endpointUrl.origin;

    this.agentName = agentName;
    this.agentVersion = agentVersion;
    this.deviceId = deviceId;
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

  async login(email, password) {
    const response = await this.post(
      'login',
      {
        email,
        password,
        deviceId: this.deviceId,
      },
      { returnResponse: true },
    );
    const serverType = response.headers.get('X-Tamanu-Server');
    if (![SERVER_TYPES.FACILITY, SERVER_TYPES.CENTRAL].includes(serverType)) {
      throw new Error(`Tamanu server type '${serverType}' is not supported.`);
    }

    const {
      token,
      localisation,
      server = {},
      permissions,
      centralHost,
      role,
    } = await response.json();
    server.type = serverType;
    server.centralHost = centralHost;
    this.setToken(token);

    const { user, ability } = await this.fetchUserData(permissions);
    return { user, token, localisation, server, ability, role };
  }

  async fetchUserData(permissions) {
    const user = await this.get('user/me');
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
    try {
      const response = await this.post('refresh');
      const { token } = response;
      this.setToken(token);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  setToken(token) {
    this.#authHeader = { authorization: `Bearer ${token}` };
  }

  async fetch(endpoint, query = {}, config = {}) {
    const { headers, returnResponse = false, throwResponse = false, ...otherConfig } = config;
    const queryString = qs.stringify(query || {});
    const path = `${endpoint}${query ? `?${queryString}` : ''}`;
    const url = `${this.#prefix}/${path}`;
    const response = await fetchOrThrowIfUnavailable(url, {
      headers: {
        ...this.#authHeader,
        ...headers,
        'X-Tamanu-Client': this.agentName,
        'X-Version': this.agentVersion,
      },
      ...otherConfig,
    });

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
    const { error } = await getResponseErrorSafely(response);
    const message = error?.message || response.status.toString();

    // handle forbidden error and trigger catch all modal
    if (response.status === 403 && error) {
      throw new ForbiddenError(message);
    }

    if (response.status === 404) {
      throw new NotFoundError(message);
    }

    // handle auth expiring
    if (response.status === 401 && endpoint !== 'login' && this.#onAuthFailure) {
      const message = 'Your session has expired. Please log in again.';
      this.#onAuthFailure(message);
      throw new AuthExpiredError(message);
    }

    // handle version incompatibility
    if (response.status === 400 && error) {
      const versionIncompatibleMessage = getVersionIncompatibleMessage(error, response);
      if (versionIncompatibleMessage) {
        if (this.#onVersionIncompatible) {
          this.#onVersionIncompatible(versionIncompatibleMessage);
        }
        throw new VersionIncompatibleError(versionIncompatibleMessage);
      }
    }

    throw new ServerResponseError(`Server error response: ${message}`);
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
}
