/// <reference path="../../shared/types/errors.d.ts" />
/// <reference path="../../shared/types/buildAbility.d.ts" />

import qs from 'qs';

import type { AnyAbility, PureAbility } from '@casl/ability';
import { SERVER_TYPES } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/shared/errors';
import { Permission, buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';

import {
  AuthExpiredError,
  ServerResponseError,
  VersionIncompatibleError,
  getVersionIncompatibleMessage,
} from './errors';
import {
  RequestOptions,
  fetchOrThrowIfUnavailable,
  getResponseErrorSafely,
} from './fetch';

export interface UserResponse {
  id: string;
}

export type AuthFailureHandler = (message: string) => void;
export type VersionIncompatibleHandler = (message: string) => void;

export interface QueryData {
  [key: string]: string | number | boolean;
}

export interface FetchConfig extends RequestOptions {
  /**
   * If true, the Response object will be returned instead of the parsed JSON.
   *
   * Defaults to false.
   */
  returnResponse?: boolean;

  /**
   * If true, the Response object will be thrown instead of attempting to parse
   * an error from the response body.
   *
   * Defaults to false.
   */
  throwResponse?: boolean;
}

export interface ChangePasswordArgs {
  email: string;
}

export interface LoginOutput<T extends AnyAbility = PureAbility> {
  user: UserResponse;
  token: string;
  localisation: object;
  server: string;
  ability: T;
  role: string;
}

export class TamanuApi {
  agentName: string;
  agentVersion: string;
  deviceId: string;

  #host?: string;
  #prefix?: string;

  #onAuthFailure?: AuthFailureHandler;
  #onVersionIncompatible?: VersionIncompatibleHandler;
  #authHeader?: Record<string, string>;

  lastRefreshed?: number;
  user?: UserResponse;

  constructor(agentName: string, agentVersion: string, deviceId: string) {
    this.agentName = agentName;
    this.agentVersion = agentVersion;
    this.deviceId = deviceId;
  }

  setHost(host: string) {
    const canonicalHost = host.endsWith('/') ? host.slice(0, -1) : host;
    this.#host = canonicalHost;
    this.#prefix = `${canonicalHost}/v1`;
  }

  getHost(): string | undefined {
    return this.#host;
  }

  setAuthFailureHandler(handler: AuthFailureHandler) {
    this.#onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler: VersionIncompatibleHandler) {
    this.#onVersionIncompatible = handler;
  }

  async login(
    host: string,
    email: string,
    password: string,
  ): Promise<LoginOutput> {
    this.setHost(host);
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
    if (![SERVER_TYPES.LAN, SERVER_TYPES.SYNC].includes(serverType)) {
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

  async fetchUserData(permissions?: Permission[]) {
    const user = await this.get('user/me');
    this.lastRefreshed = Date.now();
    this.user = user;

    if (!permissions) {
      // TODO: fetch permissions from server
      return { user, ability: buildAbilityForUser(user, []) };
    }

    const ability = buildAbilityForUser(user, permissions);
    return { user, ability };
  }

  async requestPasswordReset(host: string, email: string) {
    this.setHost(host);
    return this.post('resetPassword', { email });
  }

  async changePassword(host: string, args: ChangePasswordArgs) {
    this.setHost(host);
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

  setToken(token: string) {
    this.#authHeader = { authorization: `Bearer ${token}` };
  }

  async fetch(
    endpoint: string,
    query: QueryData = {},
    config: FetchConfig = {},
  ) {
    if (!this.#host) {
      throw new Error("API can't be used until the host is set");
    }

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
      return response;
    }

    return this.extractError(endpoint, response);
  }

  /**
   * Handle errors from the server response.
   *
   * Generally only used internally.
   */
  async extractError(endpoint: string, response: Response) {
    const { error } = await getResponseErrorSafely(response);

    // handle forbidden error and trigger catch all modal
    if (response.status === 403 && error) {
      throw new ForbiddenError(error?.message);
    }

    // handle auth expiring
    if (
      response.status === 401 &&
      endpoint !== 'login' &&
      this.#onAuthFailure
    ) {
      const message = 'Your session has expired. Please log in again.';
      this.#onAuthFailure(message);
      throw new AuthExpiredError(message);
    }

    // handle version incompatibility
    if (response.status === 400 && error) {
      const versionIncompatibleMessage = getVersionIncompatibleMessage(
        error,
        response,
      );
      if (versionIncompatibleMessage) {
        if (this.#onVersionIncompatible) {
          this.#onVersionIncompatible(versionIncompatibleMessage);
        }
        throw new VersionIncompatibleError(versionIncompatibleMessage);
      }
    }

    const message = error?.message || response.status;
    throw new ServerResponseError(`Server error response: ${message}`);
  }

  async get(endpoint: string, query: QueryData = {}, config: FetchConfig = {}) {
    return this.fetch(endpoint, query, { ...config, method: 'GET' });
  }

  async download(endpoint: string, query: QueryData = {}) {
    const response = await this.fetch(endpoint, query, {
      returnResponse: true,
    });
    const blob = await response.blob();
    return blob;
  }

  async post<T>(endpoint: string, body?: T, config: FetchConfig = {}) {
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

  async put<T>(endpoint: string, body?: T, config: FetchConfig = {}) {
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

  async delete(
    endpoint: string,
    query: QueryData = {},
    config: FetchConfig = {},
  ) {
    return this.fetch(endpoint, query, { ...config, method: 'DELETE' });
  }
}
