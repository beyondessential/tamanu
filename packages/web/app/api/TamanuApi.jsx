import React from 'react';
import { TamanuApi as ApiClient } from '@tamanu/api-client';
import { ENGLISH_LANGUAGE_CODE, SERVER_TYPES } from '@tamanu/constants';

import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ERROR_TYPE } from '@tamanu/errors';

const {
  TOKEN,
  LOCALISATION,
  SERVER,
  AVAILABLE_FACILITIES,
  FACILITY_ID,
  COUNTRY_TIME_ZONE,
  PERMISSIONS,
  ROLE,
  SETTINGS,
  LANGUAGE,
} = LOCAL_STORAGE_KEYS;

function safeGetStoredJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return {};
  }
}

function restoreFromLocalStorage() {
  const token = localStorage.getItem(TOKEN);
  const facilityId = localStorage.getItem(FACILITY_ID);
  const localisation = safeGetStoredJSON(LOCALISATION);
  const server = safeGetStoredJSON(SERVER);
  const availableFacilities = safeGetStoredJSON(AVAILABLE_FACILITIES);
  const countryTimeZone = localStorage.getItem(COUNTRY_TIME_ZONE);
  const permissions = safeGetStoredJSON(PERMISSIONS);
  const role = safeGetStoredJSON(ROLE);
  const settings = safeGetStoredJSON(SETTINGS);

  return {
    token,
    localisation,
    server,
    availableFacilities,
    facilityId,
    countryTimeZone,
    permissions,
    role,
    settings,
  };
}

function saveToLocalStorage({
  localisation,
  server,
  availableFacilities,
  facilityId,
  countryTimeZone,
  permissions,
  role,
  settings,
}) {
  if (facilityId) {
    localStorage.setItem(FACILITY_ID, facilityId);
  }
  if (server) {
    localStorage.setItem(SERVER, JSON.stringify(server));
  }
  if (localisation) {
    localStorage.setItem(LOCALISATION, JSON.stringify(localisation));
  }
  if (permissions) {
    localStorage.setItem(PERMISSIONS, JSON.stringify(permissions));
  }
  if (availableFacilities) {
    localStorage.setItem(AVAILABLE_FACILITIES, JSON.stringify(availableFacilities));
  }
  if (countryTimeZone) {
    localStorage.setItem(COUNTRY_TIME_ZONE, countryTimeZone);
  }
  if (role) {
    localStorage.setItem(ROLE, JSON.stringify(role));
  }
  if (settings) {
    localStorage.setItem(SETTINGS, JSON.stringify(settings));
  }
}

function clearLocalStorage() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(LOCALISATION);
  localStorage.removeItem(SERVER);
  localStorage.removeItem(AVAILABLE_FACILITIES);
  localStorage.removeItem(FACILITY_ID);
  localStorage.removeItem(COUNTRY_TIME_ZONE);
  localStorage.removeItem(PERMISSIONS);
  localStorage.removeItem(ROLE);
  localStorage.removeItem(SETTINGS);
}

export function isErrorUnknownDefault(error) {
  const status = error?.status;
  if (!status || typeof status !== 'number') {
    return true;
  }
  // we don't want to show toast for 403 (no permission) errors
  return status >= 400 && status != 403;
}

export function isErrorUnknownAllow404s(error) {
  const status = error?.status;
  if (status === 404) {
    return false;
  }
  return isErrorUnknownDefault(error);
}

export class TamanuApi extends ApiClient {
  constructor(appVersion) {
    const host = new URL(location);
    host.pathname = '';
    host.search = '';
    host.hash = '';
    host.pathname = '/api';

    super({
      endpoint: host.toString(),
      agentName: SERVER_TYPES.WEBAPP,
      agentVersion: appVersion,
      deviceId: getDeviceId(),
    });

    this.interceptors.request.use(config => {
      const language = localStorage.getItem(LANGUAGE);
      config.headers['language'] = language;
      return config;
    });
  }

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN, token);
    } else {
      localStorage.removeItem(TOKEN);
    }
    return super.setToken(token);
  }

  // Overwrite base method to integrate with the facility-server refresh endpoint which just
  // checks for an apiToken and returns a new one.
  async refreshToken(config = {}) {
    const response = await this.post(
      'refresh',
      {
        deviceId: this.deviceId,
      },
      config,
    );
    const { token } = response;
    this.setToken(token);
  }

  async restoreSession() {
    const {
      token,
      localisation,
      server,
      availableFacilities,
      facilityId,
      countryTimeZone,
      permissions,
      role,
      settings,
    } = restoreFromLocalStorage();
    if (!token) {
      throw new Error('No stored session found.');
    }

    this.setToken(token);
    const config = { showUnknownErrorToast: false };
    const { user, ability } = await this.fetchUserData(permissions, config);

    return {
      user,
      token,
      localisation,
      server,
      availableFacilities,
      facilityId,
      countryTimeZone,
      ability,
      role,
      settings,
    };
  }

  async login(email, password) {
    const output = await super.login(email, password);
    const {
      localisation,
      server,
      availableFacilities,
      countryTimeZone,
      permissions,
      role,
      settings,
    } = output;
    saveToLocalStorage({
      localisation,
      server,
      availableFacilities,
      countryTimeZone,
      permissions,
      role,
      settings,
    });
    return output;
  }

  async setFacility(facilityId) {
    // The setFacility endpoint returns an updated token with facilityId embedded in the JWT claims.
    // This new token is stored and used for subsequent authenticated requests to facility-scoped endpoints.
    const { settings, token } = await this.post('setFacility', { facilityId });

    this.setToken(token);

    saveToLocalStorage({
      facilityId,
      settings,
    });
    return { settings };
  }

  async fetch(endpoint, query, config) {
    const {
      isErrorUnknown = isErrorUnknownDefault,
      showUnknownErrorToast = false,
      ...otherConfig
    } = config;

    try {
      return await super.fetch(endpoint, query, otherConfig);
    } catch (err) {
      if (err.type.startsWith(ERROR_TYPE.AUTH)) {
        clearLocalStorage();
      } else if (showUnknownErrorToast && isErrorUnknown(err)) {
        const language = localStorage.getItem(LANGUAGE);
        notifyError([
          <b key="general.api.notification.requestFailed">
            <TranslatedText
              stringId="general.api.notification.requestFailed"
              fallback="Network request failed"
            />
          </b>,
          // Only show full server messages in English
          ...(!language || language === ENGLISH_LANGUAGE_CODE
            ? [
                <TranslatedText
                  key="general.api.notification.path"
                  stringId="general.api.notification.path"
                  fallback="Path: :path"
                  replacements={{ path: err.path ?? endpoint }}
                />,
                <TranslatedText
                  key="general.api.notification.message"
                  stringId="general.api.notification.message"
                  fallback="Message: :message"
                  replacements={{ message: err?.title }}
                />,
              ]
            : []),
        ]);
      }

      throw err;
    }
  }

  async get(endpoint, query, { showUnknownErrorToast = true, ...options } = {}) {
    return this.fetch(endpoint, query, { method: 'GET', showUnknownErrorToast, ...options });
  }

  async checkServerAlive() {
    return this.get('public/ping', null, { showUnknownErrorToast: false });
  }
}
