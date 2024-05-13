import { TamanuApi as ApiClient, AuthExpiredError } from '@tamanu/api-client';
import { SERVER_TYPES } from '@tamanu/constants';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';

import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';

const {
  TOKEN,
  LOCALISATION,
  SERVER_TYPE,
  AVAILABLE_FACILITIES,
  PERMISSIONS,
  ROLE,
  SETTINGS,
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
  const localisation = safeGetStoredJSON(LOCALISATION);
  const serverType = safeGetStoredJSON(SERVER_TYPE);
  const availableFacilities = safeGetStoredJSON(AVAILABLE_FACILITIES);
  const permissions = safeGetStoredJSON(PERMISSIONS);
  const role = safeGetStoredJSON(ROLE);
  const settings = safeGetStoredJSON(SETTINGS);

  return { token, localisation, serverType, availableFacilities, permissions, role, settings };
}

function saveToLocalStorage({
  token,
  localisation,
  serverType,
  availableFacilities,
  permissions,
  role,
  settings,
}) {
  if (token) {
    localStorage.setItem(TOKEN, token);
  }
  if (localisation) {
    localStorage.setItem(LOCALISATION, JSON.stringify(localisation));
  }
  if (serverType) {
    localStorage.setItem(SERVER_TYPE, JSON.stringify(serverType));
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
  localStorage.removeItem(SERVER_TYPE);
  localStorage.removeItem(AVAILABLE_FACILITIES);
  localStorage.removeItem(PERMISSIONS);
  localStorage.removeItem(ROLE);
  localStorage.removeItem(SETTINGS);
}

export function isErrorUnknownDefault(error) {
  if (!error || typeof error.status !== 'number') {
    return true;
  }
  return error.status >= 400;
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
  }

  async restoreSession() {
    const {
      token,
      localisation,
      serverType,
      availableFacilities,
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

    return { user, token, localisation, serverType, availableFacilities, ability, role, settings };
  }

  async login(email, password) {
    const output = await super.login(email, password);
    const {
      token,
      localisation,
      serverType,
      availableFacilities,
      permissions,
      role,
      settings,
    } = output;
    saveToLocalStorage({
      token,
      localisation,
      serverType,
      availableFacilities,
      permissions,
      role,
      settings,
    });
    return output;
  }

  async setFacility(facilityId) {
    const { token } = await this.post('setFacility', { facilityId });
    this.setToken(token);
    saveToLocalStorage({
      token,
    });
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
        notifyError([
          'Network request failed',
          `Path: ${err.path ?? endpoint}`,
          `Message: ${message}`,
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
