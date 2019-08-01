const encodeQueryString = query =>
  Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

export class TamanuApi {
  constructor(host) {
    this.host = host;
    this.auth = {};
  }

  setAuthToken(token) {
    this.auth = {
      Authorization: `Basic ${token}`,
    };
  }

  async fetch(endpoint, query = {}, config) {
    const queryString = encodeQueryString(query);
    const url = `${this.host}/${endpoint}${query ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      headers: {
        ...this.auth,
      },
      ...config,
    });
    return response.json();
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
}
