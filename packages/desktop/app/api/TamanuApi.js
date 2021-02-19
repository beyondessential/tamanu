import faye from 'faye';

const encodeQueryString = query =>
  Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const REFRESH_DURATION = 2.5 * 60 * 1000; // refresh if token is more than 2.5 minutes old

export class TamanuApi {
  constructor(host) {
    this.host = host;
    this.prefix = `${host}/v1`;
    this.onAuthFailure = null;
    this.authHeader = null;
    this.fayeClient = new faye.Client(`${host}/faye`);
  }

  setAuthFailureHandler(handler) {
    this.onAuthFailure = handler;
  }

  async login(email, password) {
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
    const { headers, ...otherConfig } = config;
    const queryString = encodeQueryString(query || {});
    const url = `${this.prefix}/${endpoint}${query ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      headers: {
        ...this.authHeader,
        ...headers,
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

    if (response.status === 403 || response.status === 401) {
      if (this.onAuthFailure) {
        this.onAuthFailure(response);
      }
    }

    throw new Error(response.status);
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
   * @param {*} changeType  Current one of save, remove, wipe, or * for all
   */
  async subscribeToChanges(recordType, changeType, callback) {
    const channel = `/${recordType}${changeType ? `/${changeType}` : '/*'}`;
    return this.fayeClient.subscribe(channel, callback);
  }
}
