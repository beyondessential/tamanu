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

  async refreshToken() {
    // calculate whether we need to fetch a new token
    const willExpireSoon = Date.now() < this.tokenExpiry + this.tokenExpiryMarginMs;
    const hasToken = !!this.token;
    if (!willExpireSoon && hasToken) {
      return; // no reason to refresh the token
    }

    const { access_token: accessToken, expires_in: tokenExpiry } = await this.fetchWithAuth(
      `${this.host}/token`,
      {
        validateSchema: schema.remoteResponse.token,
        retryAuth: false,
        method: 'GET',
        body: encodeParams({
          grant_type: 'password',
          username: this.username,
          password: this.password,
        }),
      },
    );
    this.accessToken = accessToken;
    this.tokenExpiry = tokenExpiry;
  }

  async fetchWithAuth(path, options = {}) {
    const { retryAuth = true, validateSchema = null, ...fetchOptions } = options;
    if (!validateSchema) {
      throw new Error(`fetchWithAuth: must supply a schema to validate against for path ${path}`);
    }

    // attempt fetch
    const response = await fetch(`${this.host}/${path}`, fetchOptions);

    // handle auth failure by clearing and refreshing token then retrying
    if (retryAuth && response.status === AUTH_FAILED_STATUS) {
      this.clearToken();
      await this.refreshToken({ force: true });
      return this.fetchWithAuth(path, { retryAuth: false, fetchOptions });
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
    const vrsPatient = await this.fetchWithAuth(`/api/Applicants/Tamanu/Fetch/${fetchId}`, {
      validateSchema: schema.remoteResponse.fetchPatient,
    });
    return this.convertVRSPatientToInternal(vrsPatient);
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
          type: 'village', // TODO: verify and point to constants
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

