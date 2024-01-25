import qs from 'qs';

import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';
import { SERVER_TYPES, VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';
import { ForbiddenError, NotFoundError } from '@tamanu/shared/errors';

import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';

const { TOKEN, LOCALISATION, SERVER, PERMISSIONS, ROLE } = LOCAL_STORAGE_KEYS;

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

const getVersionIncompatibleMessage = (error, response) => {
  if (error.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
    return 'Tamanu is out of date, reload to get the new version! If that does not work, contact your system administrator.';
  }

  if (error.message === VERSION_COMPATIBILITY_ERRORS.HIGH) {
    const maxAppVersion = response.headers
      .get('X-Max-Client-Version')
      .split('.', 3)
      .slice(0, 2)
      .join('.');
    return `The Tamanu Facility Server only supports up to v${maxAppVersion}, and needs to be upgraded. Please contact your system administrator.`;
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
        'The Facility Server is unavailable. Please contact your system administrator.',
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
  const role = safeGetStoredJSON(ROLE);

  return { token, localisation, server, permissions, role };
}

function saveToLocalStorage({ token, localisation, server, permissions, role }) {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(LOCALISATION, JSON.stringify(localisation));
  localStorage.setItem(SERVER, JSON.stringify(server));
  localStorage.setItem(PERMISSIONS, JSON.stringify(permissions));
  localStorage.setItem(ROLE, JSON.stringify(role));
}

function clearLocalStorage() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(LOCALISATION);
  localStorage.removeItem(SERVER);
  localStorage.removeItem(PERMISSIONS);
  localStorage.removeItem(ROLE);
}

export function isErrorUnknownDefault(error, response) {
  if (!response || typeof response.status !== 'number') {
    return true;
  }
  return response.status >= 400;
}

export function isErrorUnknownAllow404s(error, response) {
  if (response?.status === 404) {
    return false;
  }
  return isErrorUnknownDefault(error, response);
}

export class TamanuApi {
  constructor(appVersion) {
    this.appVersion = appVersion;
    this.onAuthFailure = null;
    this.authHeader = null;
    this.onVersionIncompatible = null;
    this.user = null;
    this.deviceId = getDeviceId();

    const host = new URL(location);
    host.pathname = '';
    host.search = '';
    host.hash = '';
    this.host = host.toString();
    host.pathname = '/api';
    this.prefix = host.toString();
  }

  setAuthFailureHandler(handler) {
    this.onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler) {
    this.onVersionIncompatible = handler;
  }

  async restoreSession() {
    const { token, localisation, server, permissions, role } = restoreFromLocalStorage();
    if (!token) {
      throw new Error('No stored session found.');
    }
    this.setToken(token);
    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    return { user, token, localisation, server, ability, role };
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
    saveToLocalStorage({ token, localisation, server, permissions, role });
    this.setToken(token);
    this.lastRefreshed = Date.now();

    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    return { user, token, localisation, server, ability, role };
  }

  async requestPasswordReset(email) {
    return this.post('resetPassword', { email });
  }

  async changePassword(data) {
    return this.post('changePassword', data);
  }

  async checkServerAlive() {
    return this.get('public/ping', null, { showUnknownErrorToast: false });
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
    this.authHeader = token ? { authorization: `Bearer ${token}` } : {};
  }

  async fetch(endpoint, query, config) {
    const {
      headers,
      returnResponse = false,
      showUnknownErrorToast = false,
      isErrorUnknown = isErrorUnknownDefault,
      ...otherConfig
    } = config;
    const queryString = qs.stringify(query || {});
    const path = `${endpoint}${query ? `?${queryString}` : ''}`;
    const url = `${this.prefix}/${path}`;
    const response = await fetchOrThrowIfUnavailable(url, {
      headers: {
        ...this.authHeader,
        ...headers,
        'X-Version': this.appVersion,
        'X-Tamanu-Client': SERVER_TYPES.WEBAPP,
      },
      ...otherConfig,
    });
    if (response.ok) {
      if (returnResponse) {
        return response;
      }
      return response.json();
    }

    const { error } = await getResponseJsonSafely(response);

    // TODO: handle server gone errors (502 through 504)

    // handle forbidden error and trigger catch all modal
    if (response.status === 403 && error) {
      throw new ForbiddenError(error?.message);
    }

    // handle auth expiring
    if (response.status === 401 && endpoint !== 'login' && this.onAuthFailure) {
      clearLocalStorage();
      const message = 'Your session has expired. Please log in again.';
      this.onAuthFailure(message);
      throw new Error(message);
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
    const message = error?.message || response.status;
    if (showUnknownErrorToast && isErrorUnknown(error, response)) {
      notifyError(['Network request failed', `Path: ${path}`, `Message: ${message}`]);
    }

    if (response.status === 404) {
      throw new NotFoundError(message);
    }

    throw new Error(`Facility server error response: ${message}`);
  }

  async get(endpoint, query, { showUnknownErrorToast = true, ...options } = {}) {
    return this.fetch(endpoint, query, { method: 'GET', showUnknownErrorToast, ...options });
  }

  async download(endpoint, query) {
    const response = await this.fetch(endpoint, query, { returnResponse: true });
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
