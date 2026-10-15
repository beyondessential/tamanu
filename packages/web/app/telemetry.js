import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import {
  initBrowserTelemetry,
  genericiseApiPath,
} from '@tamanu/ui-components';
import { TELEMETRY_INTERFACES } from '@tamanu/constants';

import { checkIsLoggedIn, checkIsFacilitySelected } from './store/auth';
import { getDeviceId } from './utils';
import { FULL_VERSION } from './utils/env';
import { LOCAL_STORAGE_KEYS } from './constants';

// spec: BTEL
// Wires browser performance telemetry for the web client (clinical + admin,
// which share this bundle). Collection starts at bootstrap, before sign-in; the
// route listener below starts a navigation on each route change.

let telemetry = null;

// One id per page load, standing in for the browser session. Uses `uuid` rather
// than `crypto.randomUUID`, which needs a secure context: the clinical app is
// sometimes served over HTTP via a LAN IP (e.g. Iti). `uuid` prefers randomUUID
// and falls back to `crypto.getRandomValues`.
const SESSION_ID = `web-session-${uuidv4()}`;

function readTelemetryEnabled() {
  try {
    const settings = JSON.parse(window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.SETTINGS));
    // Default on until the facility's setting is known (pre-login), matching the
    // schema default.
    return settings?.telemetry?.enabled ?? true;
  } catch {
    return true;
  }
}

function currentInterface() {
  return window?.location?.pathname?.startsWith('/admin')
    ? TELEMETRY_INTERFACES.ADMIN
    : TELEMETRY_INTERFACES.CLINICAL;
}

export function initWebTelemetry(api) {
  telemetry = initBrowserTelemetry({
    api,
    isEnabled: readTelemetryEnabled,
    getContextAttributes: () => ({
      interface: currentInterface(),
      deviceId: getDeviceId(),
      appVersion: FULL_VERSION,
      sessionId: SESSION_ID,
      userId: api?.user?.id ?? null,
    }),
  });
  return telemetry;
}

// Rendered inside the router: starts a navigation whenever the page being shown
// changes. That is usually a path change, but `App` also swaps the login and
// facility-selection screens in on the *same* URL, so the real page load only
// begins once those gates clear — without them as dependencies the post-login
// load would never start a navigation and all its requests would be dropped.
export const TelemetryRouteListener = () => {
  const location = useLocation();
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const isFacilitySelected = useSelector(checkIsFacilitySelected);
  useEffect(() => {
    if (!telemetry) return;
    const { route, pathParams } = genericiseApiPath(location.pathname);
    const query = Object.fromEntries(new URLSearchParams(location.search));
    telemetry.startNavigation(route, pathParams, query);
  }, [location.pathname, location.search, isUserLoggedIn, isFacilitySelected]);
  return null;
};
