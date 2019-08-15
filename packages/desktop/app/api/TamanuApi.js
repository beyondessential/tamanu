const encodeQueryString = query =>
  Object.entries(query)
    .filter(([key, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

export class TamanuApi {
  constructor(host) {
    this.host = host;
    this.authHeader = null;
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
}
