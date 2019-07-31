
const encodeQueryString = (query) => Object.entries(query)
  .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value))
  .join('&');

class API {

  constructor(host) {
    this.host = host;
    this.auth = {};
  }

  setAuthToken(token) {
    this.auth = {
      'Authorization': `Basic ${token}`,
    };
  }

  async get(endpoint, query) {
    const queryString = encodeQueryString(query);
    const result = await fetch(`${this.host}/${endpoint}?${queryString}`, {
      method: 'GET',
      headers: {
        ...this.auth,
      }
    });
    return result.json();
  }
  
  async post(endpoint, body) {
    const result = await fetch(`${this.host}/${endpoint}`, {
      method: 'POST',
      body: body && JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...this.auth,
      }
    });
    return result.json();
  }

}

export const api = new API(process.env.HOST);
