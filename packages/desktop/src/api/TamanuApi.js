import qs from 'qs';

import { buildAbilityForUser } from 'shared/permissions/buildAbility';
import { VERSION_COMPATIBILITY_ERRORS, SERVER_TYPES } from 'shared/constants';
import { ForbiddenError } from 'shared/errors';
import { LOCAL_STORAGE_KEYS } from '../constants';

const { HOST, TOKEN, LOCALISATION, SERVER, PERMISSIONS } = LOCAL_STORAGE_KEYS;

const getResponseJsonSafely = async response => {
  try {
    return await response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    // eslint-disable-next-line no-console
    console.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    return {};
  }
};

const REFRESH_DURATION = 2.5 * 60 * 1000; // refresh if token is more than 2.5 minutes old

const getVersionIncompatibleMessage = (error, response) => {
  if (error.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
    const minAppVersion = response.headers.get('X-Min-Client-Version');
    return `Please upgrade to Tamanu Desktop v${minAppVersion} or higher. Try closing and reopening, or contact your system administrator.`;
  }

  if (error.message === VERSION_COMPATIBILITY_ERRORS.HIGH) {
    const maxAppVersion = response.headers.get('X-Max-Client-Version');
    return `The Tamanu LAN Server only supports up to v${maxAppVersion}, and needs to be upgraded. Please contact your system administrator.`;
  }

  return null;
};

const fetchOrThrowIfUnavailable = async (url, config) => {
  try {
    const response = await fetch(url, config);
    return response;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e.message);
    // apply more helpful message if the server is not available
    if (e.message === 'Failed to fetch') {
      throw new Error(
        'The LAN Server is unavailable. Please check with your system administrator that the address is set correctly, and that it is running',
      );
    }
    throw e; // some other unhandled error
  }
};

function safeGetStoredJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return {};
  }
}

function restoreFromLocalStorage() {
  const token = localStorage.getItem(TOKEN);
  const localisation = safeGetStoredJSON(LOCALISATION);
  const server = safeGetStoredJSON(SERVER);
  const permissions = safeGetStoredJSON(PERMISSIONS);

  return { token, localisation, server, permissions };
}

function saveToLocalStorage({ token, localisation, server, permissions }) {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(LOCALISATION, JSON.stringify(localisation));
  localStorage.setItem(SERVER, JSON.stringify(server));
  localStorage.setItem(PERMISSIONS, JSON.stringify(permissions));
}

function clearLocalStorage() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(LOCALISATION);
  localStorage.removeItem(SERVER);
  localStorage.removeItem(PERMISSIONS);
}

export class TamanuApi {
  constructor(appVersion) {
    this.appVersion = appVersion;
    this.onAuthFailure = null;
    this.authHeader = null;
    this.onVersionIncompatible = null;
    this.user = null;

    const host = window.localStorage.getItem(HOST);
    if (host) {
      this.setHost(host);
    }
  }

  setHost(host) {
    this.host = host;
    this.prefix = `${host}/v1`;

    // save host in local storage
    window.localStorage.setItem(HOST, host);
  }

  setAuthFailureHandler(handler) {
    this.onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler) {
    this.onVersionIncompatible = handler;
  }

  async restoreSession() {
    const { token, localisation, server, permissions } = restoreFromLocalStorage();
    if (!token) {
      throw new Error('No stored session found.');
    }
    this.setToken(token);
    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    return { user, token, localisation, server, ability };
  }

  async login(host, email, password) {
    this.setHost(host);
    const response = await this.post('login', { email, password }, { returnResponse: true });
    const serverType = response.headers.get('X-Tamanu-Server');

    if (![SERVER_TYPES.LAN, SERVER_TYPES.SYNC].includes(serverType)) {
      throw new Error(`Tamanu server type '${serverType}' is not supported.`);
    }

    const { token, localisation, server = {}, permissions } = await response.json();
    server.type = serverType;
    saveToLocalStorage({ token, localisation, server, permissions });
    this.setToken(token);
    this.lastRefreshed = Date.now();

    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    return { user, token, localisation, server, ability };
  }

  async requestPasswordReset(host, email) {
    this.setHost(host);
    return this.post('resetPassword', { email });
  }

  async changePassword(host, data) {
    this.setHost(host);
    return this.post('changePassword', data);
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
    this.authHeader = { authorization: `Bearer ${token}` };
  }

  async fetch(endpoint, query, config) {
    if (!this.host) {
      throw new Error("TamanuApi can't be used until the host is set");
    }
    const { headers, returnResponse = false, ...otherConfig } = config;
    const queryString = qs.stringify(query || {});
    const url = `${this.prefix}/${endpoint}${query ? `?${queryString}` : ''}`;
    const response = await fetchOrThrowIfUnavailable(url, {
      headers: {
        ...this.authHeader,
        ...headers,
        'X-Version': this.appVersion,
        'X-Tamanu-Client': 'Tamanu Desktop',
      },
      ...otherConfig,
    });
    if (response.ok) {
      const timeSinceRefresh = Date.now() - this.lastRefreshed;
      if (timeSinceRefresh > REFRESH_DURATION) {
        this.lastRefreshed = Date.now();
        this.refreshToken();
      }

      if (returnResponse) {
        return response;
      }
      return response.json();
    }

    const { error } = await getResponseJsonSafely(response);

    // handle forbidden error and trigger catch all modal
    if (response.status === 403 && error) {
      throw new ForbiddenError(error?.message);
    }

    // handle auth expiring
    if (response.status === 401 && this.onAuthFailure) {
      clearLocalStorage();
      this.onAuthFailure('Your session has expired. Please log in again.');
    }

    // handle version incompatibility
    if (response.status === 400 && error) {
      const versionIncompatibleMessage = getVersionIncompatibleMessage(error, response);
      if (versionIncompatibleMessage) {
        if (this.onVersionIncompatible) {
          this.onVersionIncompatible(versionIncompatibleMessage);
        }
        throw new Error(versionIncompatibleMessage);
      }
    }
    throw new Error(error?.message || response.status);
  }

  async get(endpoint, query, options = {}) {
    return this.fetch(endpoint, query, { method: 'GET', ...options });
  }

  async postWithFileUpload(endpoint, filePath, body, options = {}) {
    // const fileData = await promises.readFile(filePath);
    // TODO web fix:
    const fileData = {};
    const blob = new Blob([fileData]);

    // We have to use multipart/formdata to support sending the file data,
    // but sending the other fields in that format loses type information
    // (for eg, sending a value of false will arrive as the string "false")
    // So, we just piggyback a json string over the multipart format, and
    // parse that on the backend.
    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(body));
    formData.append('file', blob);

    return this.fetch(endpoint, null, {
      method: 'POST',
      body: formData,
      ...options,
    });
  }

  async post(endpoint, body, options = {}) {
    return this.fetch(endpoint, null, {
      method: 'POST',
      body: body && JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
  }

  async put(endpoint, body, options = {}) {
    return this.fetch(endpoint, null, {
      method: 'PUT',
      body: body && JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
  }

  async delete(endpoint, query, options = {}) {
    return this.fetch(endpoint, query, { method: 'DELETE', ...options });
  }
}
