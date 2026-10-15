import { createBrowserTelemetryIngest } from '@tamanu/shared/utils/browserTelemetryIngest';

// spec: BTEL
// Ingests browser performance telemetry from the patient portal. The portal
// talks to central (not a facility server), so these raw spans are stored
// locally on central and carry no facility. Registered before the portal auth
// middleware so pre-login navigations are recorded.
export const portalTelemetryIngest = createBrowserTelemetryIngest();
