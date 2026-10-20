import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { initBrowserTelemetry } from '@tamanu/ui-components';

import { checkIsLoggedIn, checkIsFacilitySelected } from './store/auth';
import { PATIENT_PATHS } from './constants/patientPaths';
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

export function initWebTelemetry(api) {
  telemetry = initBrowserTelemetry({
    api,
    isEnabled: readTelemetryEnabled,
    // The interface (clinical vs admin) is stamped by the ingest endpoint, which
    // knows it authoritatively — this client doesn't need to say which app it is.
    getContextAttributes: () => ({
      deviceId: getDeviceId(),
      appVersion: FULL_VERSION,
      sessionId: SESSION_ID,
      userId: api?.user?.id ?? null,
    }),
  });
  return telemetry;
}

// The only navigation routes that carry ids are the patient drill-downs, all
// defined (with named params) in PATIENT_PATHS — the app's own route table. Every
// other page is a static path and groups as itself. Ordered most-specific first
// and matched as a prefix, so a deeper or unlisted sub-path collapses to its
// nearest id-bearing ancestor rather than ever recording a raw id.
const NAV_ROUTE_PATTERNS = [
  PATIENT_PATHS.PROGRAM_REGISTRY_SURVEY,
  PATIENT_PATHS.LAB_REQUEST,
  PATIENT_PATHS.IMAGING_REQUEST,
  PATIENT_PATHS.SUMMARY,
  PATIENT_PATHS.MAR,
  PATIENT_PATHS.PROGRAM_REGISTRY,
  PATIENT_PATHS.ENCOUNTER,
  PATIENT_PATHS.PATIENT,
];

// Resolve a concrete pathname to a route pattern and its named params by matching
// the app's own route definitions — never by inferring which segments are ids.
function resolveNavigationRoute(pathname) {
  for (const pattern of NAV_ROUTE_PATTERNS) {
    const match = matchPath({ path: pattern, end: false }, pathname);
    if (match) return { route: pattern, pathParams: match.params };
  }
  return { route: pathname, pathParams: {} };
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
    const { route, pathParams } = resolveNavigationRoute(location.pathname);
    const query = Object.fromEntries(new URLSearchParams(location.search));
    telemetry.startNavigation(route, pathParams, query);
  }, [location.pathname, location.search, isUserLoggedIn, isFacilitySelected]);
  return null;
};
