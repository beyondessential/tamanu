import faye from 'faye';
import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';

const encodeQueryString = query =>
  Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const REFRESH_DURATION = 2.5 * 60 * 1000; // refresh if token is more than 2.5 minutes old

const getResponseJsonSafely = async response => {
  try {
    return response.json();
  } catch (e) {
    // log json parsing errors, but still return a valid object
    console.error(e);
    return {};
  }
};

const getVersionIncompatibleMessage = async (error, response) => {
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

export class TamanuApi {
  constructor(appVersion) {
    this.appVersion = appVersion;
    this.onAuthFailure = null;
    this.authHeader = null;
    this.onVersionIncompatible = null;
    this.pendingSubscriptions = [];
  }

  setHost(host) {
    this.host = host;
    this.prefix = `${host}/v1`;
    this.fayeClient = new faye.Client(`${host}/faye`);
    this.pendingSubscriptions.forEach(({ recordType, changeType, callback }) =>
      this.subscribeToChanges(recordType, changeType, callback),
    );
    this.pendingSubscriptions = [];
  }

  setAuthFailureHandler(handler) {
    this.onAuthFailure = handler;
  }

  setVersionIncompatibleHandler(handler) {
    this.onVersionIncompatible = handler;
  }

  async login(host, email, password) {
    this.setHost(host);
    const response = await this.post('login', { email, password });
    const { token } = response;
    this.setToken(token);
    this.lastRefreshed = Date.now();

    const user = await this.get('user/me');
    return { user, token };
  }

  async refreshToken() {
    const response = await this.post('refresh');
    const { token } = response;
    this.setToken(token);
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
        'X-Client-Version': this.appVersion,
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

    console.error(response);

    const { error } = await getResponseJsonSafely(response);

    // handle auth expiring
    if ([401, 403].includes(response.status) && this.onAuthFailure) {
      this.onAuthFailure('Your session has expired. Please log in again.');
    }

    // handle version incompatibility
    if (response.status === 400 && error) {
      const versionIncompatibleMessage = await getVersionIncompatibleMessage(error, response);
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

  async multipart(endpoint, body) {
    const formData = new FormData();
    Object.entries(body).map(([key, value]) => {
      formData.append(key, value);
    });

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
    console.log('subbing', recordType, changeType);
    // until the faye client has been set up, push any subscriptions into an array
    if (!this.fayeClient) {
      this.pendingSubscriptions.push({ recordType, changeType, callback });
    } else {
      const channel = `/${recordType}${changeType ? `/${changeType}` : '/*'}`;
      this.fayeClient.subscribe(channel, callback);
    }
  }
}
