import React from 'react';
import {
  TamanuApi as ApiClient,
  readPersistedAuthToken,
  writePersistedAuthToken,
} from '@tamanu/api-client';
import { ENGLISH_LANGUAGE_CODE, SERVER_TYPES } from '@tamanu/constants';

import { LOCAL_STORAGE_KEYS } from '../constants';
import { getDeviceId, notifyError } from '../utils';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { ERROR_TYPE } from '@tamanu/errors';
import { API_ERROR_TOAST, classifyApiError, isErrorUnknownDefault } from './classifyApiError';

const {
  TOKEN,
  LOCALISATION,
  SERVER,
  AVAILABLE_FACILITIES,
  FACILITY_ID,
  PRIMARY_TIME_ZONE,
  PERMISSIONS,
  ROLE,
  SETTINGS,
  LANGUAGE,
} = LOCAL_STORAGE_KEYS;

function getImpersonateRoleIdFromToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.impersonateRoleId ?? null;
  } catch {
    return null;
  }
}

function safeGetStoredJSON(key) {
  try {
    return JSON.parse(window?.localStorage?.getItem(key));
  } catch (e) {
    return {};
  }
}

function restoreNonTokenFieldsFromLocalStorage() {
  const facilityId = window?.localStorage?.getItem(FACILITY_ID);
  const localisation = safeGetStoredJSON(LOCALISATION);
  const server = safeGetStoredJSON(SERVER);
  const availableFacilities = safeGetStoredJSON(AVAILABLE_FACILITIES);
  const primaryTimeZone = window?.localStorage?.getItem(PRIMARY_TIME_ZONE);
  const permissions = safeGetStoredJSON(PERMISSIONS);
  const role = safeGetStoredJSON(ROLE);
  const settings = safeGetStoredJSON(SETTINGS);

  return {
    localisation,
    server,
    availableFacilities,
    facilityId,
    primaryTimeZone,
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
  primaryTimeZone,
  permissions,
  role,
  settings,
}) {
  if (facilityId) {
    window?.localStorage?.setItem(FACILITY_ID, facilityId);
  }
  if (server) {
    window?.localStorage?.setItem(SERVER, JSON.stringify(server));
  }
  if (localisation) {
    window?.localStorage?.setItem(LOCALISATION, JSON.stringify(localisation));
  }
  if (permissions) {
    window?.localStorage?.setItem(PERMISSIONS, JSON.stringify(permissions));
  }
  if (availableFacilities) {
    window?.localStorage?.setItem(AVAILABLE_FACILITIES, JSON.stringify(availableFacilities));
  }
  if (primaryTimeZone) {
    window?.localStorage?.setItem(PRIMARY_TIME_ZONE, primaryTimeZone);
  }
  if (role) {
    window?.localStorage?.setItem(ROLE, JSON.stringify(role));
  }
  if (settings) {
    window?.localStorage?.setItem(SETTINGS, JSON.stringify(settings));
  }
}

function clearLocalStorage() {
  window?.localStorage?.removeItem(TOKEN);
  window?.localStorage?.removeItem(LOCALISATION);
  window?.localStorage?.removeItem(SERVER);
  window?.localStorage?.removeItem(AVAILABLE_FACILITIES);
  window?.localStorage?.removeItem(FACILITY_ID);
  window?.localStorage?.removeItem(PRIMARY_TIME_ZONE);
  window?.localStorage?.removeItem(PERMISSIONS);
  window?.localStorage?.removeItem(ROLE);
  window?.localStorage?.removeItem(SETTINGS);
}

const TOAST_HEADINGS = {
  [API_ERROR_TOAST.UNREACHABLE]: {
    stringId: 'general.api.notification.serverUnreachable.title',
    fallback: "Couldn't reach the server",
  },
  [API_ERROR_TOAST.EDIT_CONFLICT]: {
    stringId: 'general.api.notification.editConflict.title',
    fallback: 'This record was changed by someone else',
  },
  [API_ERROR_TOAST.SERVER]: {
    stringId: 'general.api.notification.serverError.title',
    fallback: 'Something went wrong on the server',
  },
};

const TOAST_DETAILS = {
  [API_ERROR_TOAST.UNREACHABLE]: {
    stringId: 'general.api.notification.serverUnreachable.detail',
    fallback: 'Your last action may not have been saved. Please try again.',
  },
  [API_ERROR_TOAST.EDIT_CONFLICT]: {
    stringId: 'general.api.notification.editConflict.detail',
    fallback: 'Reload the page to see the latest version before saving again.',
  },
  [API_ERROR_TOAST.SERVER]: {
    stringId: 'general.api.notification.serverError.detail',
    fallback: 'Please try again. If this keeps happening, contact your IT support.',
  },
};

function buildErrorToast(toastKind, error, endpoint) {
  const heading = TOAST_HEADINGS[toastKind];
  const detail = TOAST_DETAILS[toastKind];
  const language = window?.localStorage?.getItem(LANGUAGE);

  // The path and the raw server message only make sense for a server error, and
  // only in English: they aren't translated, and a mixed-language toast is worse
  // than none. Everything else gets the plain two-line message.
  const isEnglish = !language || language === ENGLISH_LANGUAGE_CODE;
  const showRequestDetail = toastKind === API_ERROR_TOAST.SERVER && isEnglish;

  return [
    <b key={heading.stringId}>
      <TranslatedText stringId={heading.stringId} fallback={heading.fallback} />
    </b>,
    <TranslatedText key={detail.stringId} stringId={detail.stringId} fallback={detail.fallback} />,
    ...(showRequestDetail
      ? [
          <TranslatedText
            key="general.api.notification.path"
            stringId="general.api.notification.path"
            fallback="Path: :path"
            replacements={{ path: error.path ?? endpoint }}
          />,
          <TranslatedText
            key="general.api.notification.message"
            stringId="general.api.notification.message"
            fallback="Message: :message"
            replacements={{ message: error?.title }}
          />,
        ]
      : []),
  ];
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
      const language = window?.localStorage?.getItem(LANGUAGE);
      config.headers.set('language', language);
      // The locale the browser formats dates with, so server-rendered
      // documents match what the user sees on screen.
      config.headers.set('date-time-locale', Intl.DateTimeFormat().resolvedOptions().locale);
      return config;
    });
  }

  async setToken(token, refreshToken = null) {
    super.setToken(token, refreshToken);
    await writePersistedAuthToken(TOKEN, token, this.deviceId, 'webapp');
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
    await this.setToken(token);
  }

  async fetchImpersonatedRole(impersonateRoleId, config) {
    try {
      const roles = await this.get('admin/roles', {}, config);
      const matched = roles.find(r => r.id === impersonateRoleId);
      return matched ?? { id: impersonateRoleId, name: impersonateRoleId };
    } catch {
      return { id: impersonateRoleId, name: impersonateRoleId };
    }
  }

  async restoreSession() {
    const { token } = await readPersistedAuthToken(TOKEN, this.deviceId, 'webapp');
    const {
      localisation,
      server,
      availableFacilities,
      facilityId,
      primaryTimeZone,
      permissions,
      role,
      settings,
    } = restoreNonTokenFieldsFromLocalStorage();
    if (!token) {
      throw new Error('No stored session found.');
    }

    await this.setToken(token);
    const config = { showUnknownErrorToast: false };
    const { user, ability } = await this.fetchUserData(permissions, config);

    const impersonateRoleId = getImpersonateRoleIdFromToken(token);
    const impersonatedRole =
      impersonateRoleId && user.role === 'admin'
        ? await this.fetchImpersonatedRole(impersonateRoleId, config)
        : null;

    let activeToken = token;
    let activePermissions = permissions;
    let restoredImpersonatedRole = impersonatedRole;
    if (impersonatedRole) {
      try {
        const resp = await this.get('user/permissions', {}, config);
        activePermissions = resp.permissions;
      } catch {
        try {
          const { token: cleanToken } = await this.post('admin/impersonate', { roleId: null }, config);
          this.setToken(cleanToken);
          activeToken = cleanToken;
        } catch {
          // If we can't clear impersonation either, the token is stale — let it fall through to re-auth
        }
        restoredImpersonatedRole = null;
      }
    }

    return {
      user,
      token: activeToken,
      localisation,
      server,
      availableFacilities,
      facilityId,
      primaryTimeZone,
      ability,
      permissions: activePermissions,
      role,
      settings,
      impersonatedRole: restoredImpersonatedRole,
    };
  }

  async login(email, password) {
    const output = await super.login(email, password);
    const {
      localisation,
      server,
      availableFacilities,
      primaryTimeZone,
      permissions,
      role,
      settings,
    } = output;
    saveToLocalStorage({
      localisation,
      server,
      availableFacilities,
      primaryTimeZone,
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

    await this.setToken(token);

    saveToLocalStorage({
      facilityId,
      settings,
    });
    return { settings };
  }

  async fetchFrontEndSettings(facilityId) {
    const { settings } = await this.get('settings/frontEnd', { facilityId }, {
      showUnknownErrorToast: false,
    });
    return settings ?? null;
  }

  // Caller is responsible for deciding whether the settings are still fresh
  // (e.g. facility hasn't changed since the request was issued) before persisting.
  persistSettings(settings) {
    saveToLocalStorage({ settings });
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
      if (err.type?.startsWith(ERROR_TYPE.AUTH)) {
        clearLocalStorage();
      } else if (showUnknownErrorToast && isErrorUnknown(err)) {
        // A caller-supplied predicate can ask for a toast on an error the
        // classifier stays quiet about; treat those as server errors.
        const toastKind = classifyApiError(err) ?? API_ERROR_TOAST.SERVER;
        notifyError(buildErrorToast(toastKind, err, endpoint));
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
