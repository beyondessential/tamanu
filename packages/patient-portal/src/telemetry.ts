import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router';

import { initBrowserTelemetry } from '@tamanu/ui-components';

// The portal's only id-bearing routes. Matched against the app's own route
// definitions so the pattern and its named params are explicit, never inferred.
const NAV_ROUTE_PATTERNS = ['/survey/:surveyId', '/register/:token'];

function resolveNavigationRoute(pathname: string): {
  route: string;
  pathParams: Record<string, string | undefined>;
} {
  for (const pattern of NAV_ROUTE_PATTERNS) {
    const match = matchPath({ path: pattern, end: false }, pathname);
    if (match) return { route: pattern, pathParams: match.params };
  }
  return { route: pathname, pathParams: {} };
}

import type { TamanuApi } from '@api/TamanuApi';

// spec: BTEL
// Browser performance telemetry for the patient portal. The portal talks to
// central (/api/portal), so its batches land on central's local raw store.

let telemetry: { startNavigation: Function; shutdown: Function } | null = null;

// Off until the server's setting arrives, matching the schema default (opt-in):
// nothing is collected, including before sign-in, unless an operator turns it on.
let isTelemetryEnabled = false;

/** Called once the portal's settings load, so operators can turn capture on/off. */
export function setPortalTelemetryEnabled(enabled: boolean) {
  isTelemetryEnabled = enabled === true;
}

export function initPortalTelemetry(api: TamanuApi) {
  telemetry = initBrowserTelemetry({
    api,
    isEnabled: () => isTelemetryEnabled,
    // The interface is stamped by the ingest endpoint (the portal's own central
    // mount), so the client doesn't send it.
    getContextAttributes: () => ({
      deviceId: api.deviceId,
      appVersion: api.agentVersion,
      // The user and session are only known once signed in, and change with each sign-in.
      sessionId: api.signInId ? `portal-session-${api.signInId}` : null,
      userId: api.user?.id ?? null,
    }),
  });
  return telemetry;
}

export const PortalTelemetryRouteListener = () => {
  const location = useLocation();
  useEffect(() => {
    if (!telemetry) return;
    const { route, pathParams } = resolveNavigationRoute(location.pathname);
    const query = Object.fromEntries(new URLSearchParams(location.search));
    telemetry.startNavigation(route, pathParams, query);
  }, [location.pathname, location.search]);
  return null;
};
