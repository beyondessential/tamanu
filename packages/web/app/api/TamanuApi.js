import {
  TamanuApi as ApiClient,
  AuthExpiredError,
} from '@tamanu/api-client';
import { SERVER_TYPES } from '@tamanu/constants';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';

import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';

const { TOKEN, SERVER, PERMISSIONS, ROLE, SETTINGS } = LOCAL_STORAGE_KEYS;

function safeGetStoredJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return {};
  }
}

function restoreFromLocalStorage() {
  const token = localStorage.getItem(TOKEN);
  const server = safeGetStoredJSON(SERVER);
  const permissions = safeGetStoredJSON(PERMISSIONS);
  const role = safeGetStoredJSON(ROLE);
  const settings = safeGetStoredJSON(SETTINGS);

  return { token, server, permissions, role, settings };
}

function saveToLocalStorage({ token, server, permissions, role, settings }) {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(SERVER, JSON.stringify(server));
  localStorage.setItem(PERMISSIONS, JSON.stringify(permissions));
  localStorage.setItem(ROLE, JSON.stringify(role));
  localStorage.setItem(SETTINGS, JSON.stringify(settings));
}

function clearLocalStorage() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(SERVER);
  localStorage.removeItem(PERMISSIONS);
  localStorage.removeItem(ROLE);
  localStorage.removeItem(SETTINGS);
}

export function isErrorUnknownDefault(error, response) {
  void(error); // error is required for this function signature, but we don't use it

  if (!response || typeof response.status !== 'number') {
    return true;
  }
  return response.status >= 400;
}

export function isErrorUnknownAllow404s(error, response) {
  if (response?.status === 404) {
    return false;
  }
  return isErrorUnknownDefault(error, response);
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
      deviceId: getDeviceId()
    });
  }

  async restoreSession() {
    const { token, server, permissions, role, settings } = restoreFromLocalStorage();
    if (!token) {
      throw new Error('No stored session found.');
    }
    this.setToken(token);
    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    return { user, token, server, ability, role, settings };
  }

  async login(email, password) {
    const output = await super.login(email, password);
    const { token, settings, server, permissions, role } = output;
    saveToLocalStorage({ token, settings, server, permissions, role });
    return output;
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
      const message = err?.message || err?.response?.status;

      if (err instanceof AuthExpiredError) {
        clearLocalStorage();
      } else if (showUnknownErrorToast && isErrorUnknown(err, err.response)) {
        notifyError([
          'Network request failed',
          `Path: ${err.path ?? endpoint}`,
          `Message: ${message}`,
        ]);
      }

      throw new Error(`Facility server error response: ${message}`);
    }
  }

  async get(endpoint, query, { showUnknownErrorToast = true, ...options } = {}) {
    return this.fetch(endpoint, query, { method: 'GET', showUnknownErrorToast, ...options });
  }
}
