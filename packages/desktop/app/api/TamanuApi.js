import faye from 'faye';
import { readFileSync } from 'fs';

import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';
import { LOCAL_STORAGE_KEYS } from '../constants';

const { HOST, TOKEN, LOCALISATION } = LOCAL_STORAGE_KEYS;

const getResponseJsonSafely = async response => {
  try {
    return await response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    console.warn(`getResponseJsonSafely: Error parsing JSON: ${e}`);
    return {};
  }
};

const encodeQueryString = query =>
  Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

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

function getLocalToken() {
  return localStorage.getItem(TOKEN);
}

function saveLocalToken(token) {
  localStorage.setItem(TOKEN, token);
}

function clearLocalToken() {
  localStorage.removeItem(TOKEN);
}

function getLocalLocalisation() {
  return JSON.parse(localStorage.getItem(LOCALISATION));
}

function saveLocalLocalisation(localisation) {
  localStorage.setItem(LOCALISATION, JSON.stringify(localisation));
}

function clearLocalLocalisation() {
  localStorage.removeItem(LOCALISATION);
}

export class TamanuApi {
  constructor(appVersion) {
    this.appVersion = appVersion;
    this.onAuthFailure = null;
    this.authHeader = null;
    this.onVersionIncompatible = null;
    this.pendingSubscriptions = [];
    const host = window.localStorage.getItem(HOST);
    if (host) {
      this.setHost(host);
    }
  }

  setHost(host) {
    this.host = host;
    this.prefix = `${host}/v1`;
    this.fayeClient = new faye.Client(`${host}/faye`);
    this.pendingSubscriptions.forEach(({ recordType, changeType, callback }) =>
      this.subscribeToChanges(recordType, changeType, callback),
    );
    this.pendingSubscriptions = [];

    // save host in local storage
    window.localStorage.setItem(HOST, host);
  }

  setAuthFailureHandler(handler) {
    this.onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler) {
    this.onVersionIncompatible = handler;
  }

  async checkAuth() {
    const token = getLocalToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    this.setToken(token);
    const localisation = getLocalLocalisation();
    const user = await this.get('user/me');
    return { user, token, localisation };
  }

  async login(host, email, password) {
    this.setHost(host);
    const response = await this.post('login', { email, password });
    const { token, localisation } = response;
    saveLocalToken(token);
    saveLocalLocalisation(localisation);
    this.setToken(token);
    this.lastRefreshed = Date.now();

    const user = await this.get('user/me');
    return { user, token, localisation };
  }

  async refreshToken() {
    try {
      const response = await this.post('refresh');
      const { token } = response;
      this.setToken(token);
    } catch (e) {
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
    const { headers, ...otherConfig } = config;
    const queryString = encodeQueryString(query || {});
    const url = `${this.prefix}/${endpoint}${query ? `?${queryString}` : ''}`;
    const response = await fetchOrThrowIfUnavailable(url, {
      headers: {
        ...this.authHeader,
        ...headers,
        'X-Version': this.appVersion,
        'X-Runtime': 'Tamanu Desktop',
      },
      ...otherConfig,
    });
    if (response.ok) {
      const timeSinceRefresh = Date.now() - this.lastRefreshed;
      if (timeSinceRefresh > REFRESH_DURATION) {
        this.lastRefreshed = Date.now();
        this.refreshToken();
      }

      return response.json();
    }

    const { error } = await getResponseJsonSafely(response);

    // handle auth expiring
    if ([401, 403].includes(response.status) && this.onAuthFailure) {
      clearLocalToken();
      clearLocalLocalisation();
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

  async get(endpoint, query) {
    return this.fetch(endpoint, query, { method: 'GET' });
  }

  async postWithFileUpload(endpoint, filePath, body) {
    const fileData = readFileSync(filePath);
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
    });
  }

  async post(endpoint, body) {
    return this.fetch(endpoint, null, {
      method: 'POST',
      body: body && JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async put(endpoint, body) {
    return this.fetch(endpoint, null, {
      method: 'PUT',
      body: body && JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async delete(endpoint, query) {
    return this.fetch(endpoint, query, { method: 'DELETE' });
  }

  /**
   * @param {*} changeType  Currently one of save, remove, wipe, or * for all
   */
  subscribeToChanges(recordType, changeType, callback) {
    // until the faye client has been set up, push any subscriptions into an array
    if (!this.fayeClient) {
      this.pendingSubscriptions.push({ recordType, changeType, callback });
    } else {
      const channel = `/${recordType}${changeType ? `/${changeType}` : '/*'}`;
      this.fayeClient.subscribe(channel, callback);
    }
  }
}
