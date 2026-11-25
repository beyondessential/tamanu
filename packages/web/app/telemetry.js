import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router';
import { useSelector } from 'react-redux';

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

function readTelemetryEnabled() {
  try {
    const settings = JSON.parse(window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.SETTINGS));
    // Off until the setting is known, matching the schema default (opt-in): nothing
    // is collected, including before sign-in, unless an operator turns it on.
    return settings?.telemetry?.enabled ?? false;
  } catch {
    return false;
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
      // The user and session are only known once signed in, and change with each sign-in.
      sessionId: api?.signInId ? `web-session-${api.signInId}` : null,
      userId: api?.user?.id ?? null,
    }),
  });
  return telemetry;
}

// Every navigation route that carries an id, with the named params of the app's
// own route definitions: PATIENT_PATHS for the patient drill-downs, and the
// route files under routes/ (and the admin registry tabs) for the rest. Every
// other page is a static path and groups as itself, so a new id-bearing route
// must be added here. Ordered most-specific first and matched as a prefix, so a
// deeper or unlisted sub-path collapses to its nearest id-bearing ancestor
// rather than ever recording a raw id.
const NAV_ROUTE_PATTERNS = [
  PATIENT_PATHS.PROGRAM_REGISTRY_SURVEY,
  PATIENT_PATHS.LAB_REQUEST,
  PATIENT_PATHS.IMAGING_REQUEST,
  `${PATIENT_PATHS.ENCOUNTER}/programs/:surveyResponseId/edit`,
  PATIENT_PATHS.SUMMARY,
  PATIENT_PATHS.MAR,
  PATIENT_PATHS.PROGRAM_REGISTRY,
  PATIENT_PATHS.ENCOUNTER,
  `${PATIENT_PATHS.PATIENT}/programs/:surveyResponseId/edit`,
  PATIENT_PATHS.PATIENT,
  '/program-registry/:programRegistryId',
  '/admin/programs/forms/manage/:programId',
  '/admin/programs/registries/:programRegistryId/statuses',
  '/admin/programs/registries/:programRegistryId/conditions',
  '/admin/programs/registries/:programRegistryId/conditionCategories',
  '/admin/programs/registries/:programRegistryId',
  '/admin/reports/:reportId/versions/:versionId/edit',
  '/admin/users/rolesAndDesignations/roles/delete/:id',
  '/admin/users/rolesAndDesignations/designations/delete/:id',
];

// Resolve a concrete pathname to a route pattern and its named params by matching
// the app's own route definitions — never by inferring which segments are ids.
export function resolveNavigationRoute(pathname) {
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
