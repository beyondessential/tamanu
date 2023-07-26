import { promises } from 'fs';
import { ipcRenderer } from 'electron';

import {
  TamanuApi as ApiClient,
  VersionIncompatibleError,
  isErrorUnknownDefault,
  AuthExpiredError,
} from '@tamanu/api-client';
import { buildAbilityForUser } from '@tamanu/shared/permissions/buildAbility';
import { VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';

export { isErrorUnknownDefault, isErrorUnknownAllow404s } from '@tamanu/api-client';

const { HOST, TOKEN, LOCALISATION, SERVER, PERMISSIONS, ROLE } = LOCAL_STORAGE_KEYS;

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
  const server = safeGetStoredJSON(SERVER);
  const permissions = safeGetStoredJSON(PERMISSIONS);
  const role = safeGetStoredJSON(ROLE);

  return { token, localisation, server, permissions, role };
}

function saveToLocalStorage({ token, localisation, server, permissions, role }) {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(LOCALISATION, JSON.stringify(localisation));
  localStorage.setItem(SERVER, JSON.stringify(server));
  localStorage.setItem(PERMISSIONS, JSON.stringify(permissions));
  localStorage.setItem(ROLE, JSON.stringify(role));
}

function clearLocalStorage() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(LOCALISATION);
  localStorage.removeItem(SERVER);
  localStorage.removeItem(PERMISSIONS);
  localStorage.removeItem(ROLE);
}

export class TamanuApi extends ApiClient {
  constructor(appVersion) {
    super('Tamanu Desktop', appVersion, getDeviceId());
    this.user = null;

    const host = window.localStorage.getItem(HOST);
    if (host) {
      this.setHost(host);
    }
  }

  setHost(host) {
    super.setHost(host);

    // save host in local storage
    window.localStorage.setItem(HOST, this.getHost());
  }

  async restoreSession() {
    const { token, localisation, server, permissions, role } = restoreFromLocalStorage();
    if (!token) {
      throw new Error('No stored session found.');
    }
    this.setToken(token);
    const user = await this.get('user/me');
    this.user = user;
    const ability = buildAbilityForUser(user, permissions);

    return { user, token, localisation, server, ability, role };
  }

  async login(host, email, password) {
    const output = await super.login(host, email, password);
    const { token, localisation, server, permissions, role } = output;
    saveToLocalStorage({ token, localisation, server, permissions, role });
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
      if (err instanceof AuthExpiredError) {
        clearLocalStorage();
      } else if (err instanceof VersionIncompatibleError) {
        if (err.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
          // If detect that desktop version is lower than facility server version,
          // communicate with main process to initiate the auto upgrade
          ipcRenderer.invoke('update-available', this.getHost());
        }
      } else if (showUnknownErrorToast && isErrorUnknown(err, err.response)) {
        notifyError(['Network request failed', `Path: ${err.path}`, `Message: ${err.message}`]);
      }

      throw err;
    }
  }

  async get(endpoint, query, { showUnknownErrorToast = true, ...options } = {}) {
    return this.fetch(endpoint, query, { showUnknownErrorToast, ...options });
  }

  async postWithFileUpload(endpoint, filePath, body, options = {}) {
    const fileData = await promises.readFile(filePath);
    const blob = new Blob([fileData]);

    // We have to use multipart/formdata to support sending the file data,
    // but sending the other fields in that format loses type information
    // (for eg, sending a value of false will arrive as the string "false")
    // So, we just piggyback a json string over the multipart format, and
    // parse that on the backend.
    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(body));
    formData.append('file', blob);

    return this.fetch(endpoint, null, {
      method: 'POST',
      body: formData,
      ...options,
    });
  }
}
