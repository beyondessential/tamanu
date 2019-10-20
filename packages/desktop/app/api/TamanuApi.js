import faye from 'faye';

const encodeQueryString = query =>
  Object.entries(query)
    .filter(([key, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

export class TamanuApi {
  constructor(host) {
    this.host = host;
    this.authHeader = null;
    this.fayeClient = new faye.Client(`${host}/faye`);
  }

  async login(username, password) {
    const response = await this.post('login', { email, password });
    const { token } = response;
    this.authHeader = { authorization: `Bearer ${token}` };
  }

  async fetch(endpoint, query, config) {
    const queryString = encodeQueryString(query || {});
    const url = `${this.host}/${endpoint}${query ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      headers: {
        ...this.authHeader,
      },
      ...config,
    });
    if (response.ok) {
      return response.json();
    }
    console.error(response);
    throw new Error(response.status);
  }

  async get(endpoint, query) {
    return this.fetch(endpoint, query, { method: 'GET' });
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

  /**
   * @param {*} changeType  Current one of save, remove, wipe, or * for all
   */
  async subscribeToChanges(recordType, changeType, callback) {
    const channel = `/${recordType}${changeType ? `/${changeType}` : '/*'}`;
    return this.fayeClient.subscribe(channel, callback);
  }
}
