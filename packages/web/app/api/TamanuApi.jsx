import React from 'react';
import { TamanuApi as ApiClient, AuthExpiredError } from '@tamanu/api-client';
import { ENGLISH_LANGUAGE_CODE, SERVER_TYPES } from '@tamanu/constants';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';

import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';
import { TranslatedText } from '../components/Translation/TranslatedText';

const {
  TOKEN,
  LOCALISATION,
  SERVER,
  AVAILABLE_FACILITIES,
  FACILITY_ID,
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
  const permissions = safeGetStoredJSON(PERMISSIONS);
  const role = safeGetStoredJSON(ROLE);
  const settings = safeGetStoredJSON(SETTINGS);

  return {
    token,
    localisation,
    server,
    availableFacilities,
    facilityId,
    permissions,
    role,
    settings,
  };
}

function saveToLocalStorage({
  token,
  localisation,
  server,
  availableFacilities,
  facilityId,
  permissions,
  role,
  settings,
}) {
  if (token) {
    localStorage.setItem(TOKEN, token);
  }
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
  localStorage.removeItem(PERMISSIONS);
  localStorage.removeItem(ROLE);
  localStorage.removeItem(SETTINGS);
}

export function isErrorUnknownDefault(error) {
  if (!error || typeof error.status !== 'number') {
    return true;
  }
  // we don't want to show toast for 403 (no permission) errors
  return error.status >= 400 && error.status != 403;
}

export function isErrorUnknownAllow404s(error) {
  if (error?.status === 404) {
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

  async restoreSession() {
    const {
      token,
      localisation,
      server,
      availableFacilities,
      facilityId,
      permissions,
      role,
      settings,
    } = restoreFromLocalStorage();
    if (!token) {
      throw new Error('No stored session found.');
    }
    this.setToken(token);
    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    return {
      user,
      token,
      localisation,
      server,
      availableFacilities,
      facilityId,
      ability,
      role,
      settings,
    };
  }

  async login(email, password) {
    const output = await super.login(email, password);
    const { token, localisation, server, availableFacilities, permissions, role } = output;
    saveToLocalStorage({
      token,
      localisation,
      server,
      availableFacilities,
      permissions,
      role,
    });
    return output;
  }

  async setFacility(facilityId) {
    const { token, settings } = await this.post('setFacility', { facilityId });
    this.setToken(token);
    saveToLocalStorage({
      token,
      facilityId,
      settings,
    });
    return { settings, token };
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
      const message = err?.message || err?.status;

      if (err instanceof AuthExpiredError) {
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
                  replacements={{ message }}
                />,
              ]
            : []),
        ]);
      }

      throw new Error(message);
    }
  }

  async get(endpoint, query, { showUnknownErrorToast = true, ...options } = {}) {
    return this.fetch(endpoint, query, { method: 'GET', showUnknownErrorToast, ...options });
  }

  async checkServerAlive() {
    return this.get('public/ping', null, { showUnknownErrorToast: false });
  }
}
