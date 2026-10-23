import { TELEMETRY_INTERFACES } from '@tamanu/constants';
import { createBrowserTelemetryIngest } from '@tamanu/shared/utils/browserTelemetryIngest';

// spec: BTEL
// Ingests browser performance telemetry from the patient portal. The portal
// talks to central (not a facility server), so these raw spans are stored
// locally on central and carry no facility. This mount is reached only by the
// portal, so it always stamps the patient-portal interface. Registered before the
// portal auth middleware so pre-login navigations are recorded.
export const portalTelemetryIngest = createBrowserTelemetryIngest({
  interfaceName: TELEMETRY_INTERFACES.PATIENT_PORTAL,
});
