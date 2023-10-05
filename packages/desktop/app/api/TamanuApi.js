import { promises } from 'fs';
import qs from 'qs';
import { ipcRenderer } from 'electron';

import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';
import { VERSION_COMPATIBILITY_ERRORS, SERVER_TYPES } from '@tamanu/constants';
import { ForbiddenError, NotFoundError } from '@tamanu/shared/errors';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';

const { HOST, TOKEN, LOCALISATION, SERVER, PERMISSIONS, ROLE } = LOCAL_STORAGE_KEYS;

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

    const host = window.localStorage.getItem(HOST);
    if (host) {
      this.setHost(host);
    }
  }

  setHost(host) {
    const canonicalHost = host.endsWith('/') ? host.slice(0, -1) : host;
    this.host = canonicalHost;
    this.prefix = `${canonicalHost}/v1`;

    // save host in local storage
    window.localStorage.setItem(HOST, canonicalHost);
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

  async login(host, email, password) {
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
    saveToLocalStorage({ token, localisation, server, permissions, role });
    this.setToken(token);
    this.lastRefreshed = Date.now();

    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    ipcRenderer.on('toggleDebug', () =>
      localStorage.setItem(
        'debugTranslation',
        !JSON.parse(localStorage.getItem('debugTranslation')),
      ),
    );

    return { user, token, localisation, server, ability, role };
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
        'X-Tamanu-Client': 'Tamanu Desktop',
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
        if (error.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
          // If detect that desktop version is lower than facility server version,
          // communicate with main process to initiate the auto upgrade
          ipcRenderer.invoke('update-available', this.host);
        }

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

  async postWithFileUpload(endpoint, filePath, body, options = {}) {
    const fileData = await promises.readFile(filePath);
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
