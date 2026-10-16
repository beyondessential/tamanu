import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { initBrowserTelemetry, genericiseApiPath } from '@tamanu/ui-components';
import { TELEMETRY_INTERFACES } from '@tamanu/constants';

import type { TamanuApi } from '@api/TamanuApi';

// spec: BTEL
// Browser performance telemetry for the patient portal. The portal talks to
// central (/api/portal), so its batches land on central's local raw store.

let telemetry: { startNavigation: Function; shutdown: Function } | null = null;

// Defaults on until the server's setting arrives, so navigations before sign-in
// (when no settings have loaded yet) are still captured. Matches the schema
// default and the clinical app's behaviour.
let isTelemetryEnabled = true;

/** Called once the portal's settings load, so operators can turn capture off. */
export function setPortalTelemetryEnabled(enabled: boolean) {
  isTelemetryEnabled = enabled !== false;
}

// One id per page load, standing in for the browser session. The portal is
// served over HTTPS, so `crypto.randomUUID` is available (as in getDeviceId).
const SESSION_ID = `portal-session-${crypto.randomUUID()}`;

export function initPortalTelemetry(api: TamanuApi) {
  telemetry = initBrowserTelemetry({
    api,
    isEnabled: () => isTelemetryEnabled,
    getContextAttributes: () => ({
      interface: TELEMETRY_INTERFACES.PATIENT_PORTAL,
      deviceId: api.deviceId,
      appVersion: api.agentVersion,
      sessionId: SESSION_ID,
      userId: api.user?.id ?? null,
    }),
  });
  return telemetry;
}

export const PortalTelemetryRouteListener = () => {
  const location = useLocation();
  useEffect(() => {
    if (!telemetry) return;
    const { route, pathParams } = genericiseApiPath(location.pathname);
    const query = Object.fromEntries(new URLSearchParams(location.search));
    telemetry.startNavigation(route, pathParams, query);
  }, [location.pathname, location.search]);
  return null;
};
