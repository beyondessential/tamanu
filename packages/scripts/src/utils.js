const fetch = require('node-fetch');

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  Accepts: 'application/json',
};
const getHeaders = async baseUrl => ({
  Authorization: `Bearer ${await getToken(baseUrl)}`,
  ...BASE_HEADERS,
});

const getToken = async baseUrl => {
  const loginResponse = await login(baseUrl);
  return loginResponse.token;
};

const login = async baseUrl => {
  const url = `${baseUrl}/v1/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({
      email: 'admin@tamanu.io',
      password: '',
    }),
  });
  if (!response.ok) {
    throw new Error(`Problem logging in to ${baseUrl}!`);
  }
  return response.json();
};

module.exports = {
  getHeaders,
};
