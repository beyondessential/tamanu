import fetch from 'node-fetch';

import { log } from '@tamanu/shared/services/logging';
import { RemoteCallFailedError } from '@tamanu/shared/errors';
import { getResponseJsonSafely } from '@tamanu/shared/utils';

import { VRSPatientAdapter } from './VRSPatientAdapter';

import * as schema from './schema';

const encodeParams = params =>
  Object.entries(params)
    .map(pair => pair.map(s => encodeURIComponent(s)).join('='))
    .join('&');

const AUTH_FAILED_STATUS = 401;

export class VRSRemote {
  token = null;

  tokenExpiry = 0; // timestamp of token expiry in milliseconds

  fetchImplementation = fetch; // overriden in tests

  constructor(store, { host, username, password, tokenExpiryMarginMs }) {
    this.patientAdapter = new VRSPatientAdapter(store);
    this.store = store;

    this.host = host;
    this.username = username;
    this.password = password;
    this.tokenExpiryMarginMs = tokenExpiryMarginMs;
  }

  clearToken() {
    this.token = null;
    this.tokenExpiry = 0;
  }

  async refreshTokenIfInvalid() {
    // calculate whether we need to fetch a new token
    const remainingTime = this.tokenExpiry - Date.now() - this.tokenExpiryMarginMs;
    const willExpireSoon = remainingTime <= 0;
    const hasToken = !!this.token;
    if (!willExpireSoon && hasToken) {
      return; // no reason to refresh the token
    }

    log.debug('VRSRemote.refreshTokenIfInvalid(): refreshing token...');

    // make token request
    const body = encodeParams({
      grant_type: 'password',
      username: this.username,
      password: this.password,
    });
    const { access_token: accessToken, expires_in: tokenLifetimeSecs } = await this.fetch(
      '/token',
      {
        validateSchema: schema.remoteResponse.token,
        shouldRefreshToken: false,
        method: 'POST',
        headers: {},
        body,
      },
    );
    const tokenLifetimeMs = tokenLifetimeSecs * 1000;

    // update token info
    this.token = accessToken;
    this.tokenExpiry = Date.now() + tokenLifetimeMs;

    log.debug(
      `VRSRemote.refreshTokenIfInvalid(): refreshed token (expires in ${tokenLifetimeMs}ms)`,
    );
  }

  async fetch(path, options = {}) {
    const { shouldRefreshToken = true, validateSchema = null, ...fetchOptions } = options;
    if (!validateSchema) {
      throw new Error(
        `VRSRemote.fetch(): must supply a schema to validate against for path ${path}`,
      );
    }

    // refresh token if we think it's expired
    if (shouldRefreshToken) {
      await this.refreshTokenIfInvalid();
    }

    // attempt fetch
    const url = `${this.host}${path}`;
    log.debug(`VRSRemote.fetch(): fetching ${url}...`);
    const response = await this.fetchImplementation(url, {
      headers: fetchOptions.headers || {
        'Content-Type': 'application/json',
        Accepts: 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      ...fetchOptions,
    });

    // handle auth failure by clearing and refreshing token then retrying
    if (shouldRefreshToken && response.status === AUTH_FAILED_STATUS) {
      this.clearToken();
      await this.refreshTokenIfInvalid();
      return this.fetch(path, { ...fetchOptions, validateSchema, shouldRefreshToken: false });
    }

    // throw on other errors
    if (!response.ok) {
      const errPayload = JSON.stringify(await getResponseJsonSafely(response));
      throw new RemoteCallFailedError(
        `VRSRemote.fetch(): Received ${response.status} while calling ${url} (payload=${errPayload})`,
      );
    }

    // parse, validate, and return body on success
    const body = await response.json();
    log.debug(`VRSRemote.fetch(): received body ${JSON.stringify(body)}`);
    const data = await validateSchema.validate(body, {
      stripUnknown: true,
    });
    log.debug(`VRSRemote.fetch(): fetched ${url}`);
    return data;
  }

  async getPatientByFetchId(fetchId) {
    const { data: vrsPatient } = await this.fetch(
      `/api/Tamanu/Fetch?${encodeParams({ fetch_id: fetchId })}`,
      { validateSchema: schema.remoteResponse.fetchPatient },
    );
    return this.patientAdapter.toTamanu(vrsPatient);
  }

  async acknowledge(fetchId) {
    await this.fetch(`/api/Tamanu/Acknowledge?${encodeParams({ fetch_id: fetchId })}`, {
      validateSchema: schema.remoteResponse.acknowledge,
      method: 'POST',
      headers: {
        'Content-Length': 0,
        Accepts: 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  async getAllPendingActions() {
    const { data } = await this.fetch('/api/Tamanu/FetchAllPendingActions', {
      validateSchema: schema.remoteResponse.fetchAllPendingActions,
    });
    return data;
  }
}
