#!/usr/bin/env node

import { version } from '../package.json';
import { FetchConfig, TamanuApi } from './TamanuApi.js';
import { FetchImplementation, setFetchImplementation } from './fetch.js';
import { hostname } from 'os';

async function canImport(moduleName: string): Promise<boolean> {
  try {
    await import(moduleName);
    return true;
  } catch (_: unknown) {
    return false;
  }
}

(async () => {
  if (process.argv.length < 4) {
    console.error('Usage: <method> <url> [JSON payload] [-i|--headers]');
    process.exit(1);
  }

  const { TAMANU_USER, TAMANU_PASSWORD } = process.env;
  if (!TAMANU_USER || !TAMANU_PASSWORD) {
    console.error('TAMANU_USER and TAMANU_PASSWORD must be set');
    process.exit(1);
  }

  let [method, url, json = null, ...options] = process.argv.slice(2);
  if (json?.startsWith('-')) {
    options.unshift(json);
    json = null;
  }

  if (!['get', 'post', 'put', 'delete'].includes(method)) {
    console.error(`Invalid method ${method}`);
    process.exit(1);
  }

  let payload: object = {};
  try {
    payload = json ? JSON.parse(json) : {};
    if (typeof payload !== 'object') {
      throw new Error('top-level is not a map');
    }
  } catch (err) {
    console.error('Invalid JSON payload', err);
    process.exit(1);
  }

  if (await canImport('undici')) {
    setFetchImplementation((await import('undici')).fetch as unknown as FetchImplementation);
  } else {
    console.error('Could not find fetch implementation');
    process.exit(2);
  }

  const api = new TamanuApi('FHIR', version, hostname());

  const hostonly = new URL(url);
  const endpoint = hostonly.pathname.replace(/^\//, '');
  const query = new URLSearchParams(hostonly.search);
  hostonly.pathname = '';
  hostonly.search = '';
  hostonly.hash = '';
  await api.login(hostonly.toString(), TAMANU_USER, TAMANU_PASSWORD);

  const printHeaders = options.includes('-i') || options.includes('--headers');

  const config: FetchConfig = {
    returnResponse: printHeaders,
    throwResponse: true,
  };

  let request;
  switch (method) {
    case 'get': {
      request = api.get(endpoint, Object.fromEntries(query.entries()), config);
      break;
    }

    case 'post': {
      request = api.post(endpoint, payload, config);
      break;
    }

    case 'put': {
      request = api.put(endpoint, payload, config);
      break;
    }

    case 'delete': {
      request = api.delete(endpoint, Object.fromEntries(query.entries()), config);
      break;
    }

    default: {
      throw new Error('unreachable');
    }
  }

  let response = await request.catch((errorResponse) => errorResponse);

  if (printHeaders) {
    console.error(response.status, response.statusText);
    for (const [key, value] of response.headers.entries()) {
      console.error(`${key}: ${value}`);
    }

    if (response.status === 204) {
      return;
    }

    try {
      response = await response.clone().json();
    } catch (_: unknown) {
      console.log(await response.text());
      process.exit(16);
    }
  }

  console.log(JSON.stringify(response, null, 2));

  if (!response.ok) {
    process.exit(8);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
