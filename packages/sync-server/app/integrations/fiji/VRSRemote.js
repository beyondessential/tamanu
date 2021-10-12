import fetch from 'node-fetch';
yimport { REFERENCE_TYPES } from 'shared/constants';

import * as schema from './schema';

const encodeParams = params =>
  Object.entries(params)
    .map(pair => pair.map(s => encodeURIComponent(s)).join('='))
    .join('&');

const AUTH_FAILED_STATUS = 401;

export class VRSRemote {
  token = null;

  tokenExpiry = 0; // timestamp of token expiry in milliseconds

  constructor(store, { host, username, password, tokenExpiryMarginMs }) {
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

    // make token request
    const body = encodeParams({
      grant_type: 'password',
      username: this.username,
      password: this.password,
    });
    const { access_token: accessToken, expires_in: tokenLifetime } = await this.fetch('/token', {
      validateSchema: schema.remoteResponse.token,
      shouldRefreshToken: false,
      method: 'POST',
      headers: {},
      body,
    });

    // update token info
    this.accessToken = accessToken;
    this.tokenExpiry = Date.now() + tokenLifetime;
  }

  async fetch(path, options = {}) {
    const { shouldRefreshToken = true, validateSchema = null, ...fetchOptions } = options;
    if (!validateSchema) {
      throw new Error(`VRSRemote.fetch: must supply a schema to validate against for path ${path}`);
    }

    // refresh token if we think it's expired
    if (shouldRefreshToken) {
      await this.refreshTokenIfInvalid();
    }

    // attempt fetch
    const response = await fetch(`${this.host}${path}`, {
      headers: fetchOptions.headers || {
        'Content-Type': 'application/json',
        Accepts: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
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
      throw new Error('TODO: interpret error');
    }

    // parse, validate, and return body on success
    const body = await response.json();
    return validateSchema.validate(body);
  }

  async getPatientByFetchId(fetchId) {
    const { data: vrsPatient } = await this.fetch(`/api/Tamanu/Fetch/${fetchId}`, {
      validateSchema: schema.remoteResponse.fetchPatient,
    });
    return this.convertVRSPatientToInternal(vrsPatient);
  }

  async acknowledge(fetchId) {
    await this.fetch(`/api/Tamanu/Acknowledge?${encodeParams({ fetch_id: fetchId })}`, {
      validateSchema: schema.remoteResponse.acknowledge,
    });
  }

  async convertVRSPatientToInternal({
    // TODO: what do we do with these? probably log them, right?
    individual_refno: refNo,
    id_type: idType,

    identifier: displayId,
    fname: firstName,
    lname: lastName,
    dob: dateOfBirth,
    sex,
    sub_division: villageName,
    phone,
    email, // TODO: what does that "NULL" in the card mean?
  }) {
    // look up village by name
    const { ReferenceData } = this.store.models;
    let villageId;
    if (villageName) {
      const village = await ReferenceData.findOne({
        where: {
          name: villageName,
          type: REFERENCE_TYPES.VILLAGE,
        },
      });
      if (!village) {
        // TODO: how do we handle missing villages?
        throw new Error('TODO: unknown village name');
      }
      villageId = village.id;
    }
    return {
      patient: {
        displayId,
        firstName,
        lastName,
        dateOfBirth,
        sex,
        villageId,
      },
      patientAdditionalData: {
        phone,
        email,
      },
    };
  }
}
