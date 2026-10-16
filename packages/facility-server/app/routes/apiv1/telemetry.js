import express from 'express';

import { createBrowserTelemetryIngest } from '@tamanu/shared/utils/browserTelemetryIngest';

import { getServerFacilityIds } from '../../serverConfig';

// spec: BTEL
// Ingests browser performance telemetry from the clinical web client and writes
// it to this server's local raw store, stamping its own facility. The batch
// shape, validation and insert are shared with central (which serves the admin
// panel and the patient portal); see the shared handler for the detail.
export const telemetry = express.Router();

telemetry.post(
  '/',
  createBrowserTelemetryIngest({
    getFacilityId: () => {
      const [facilityId = null] = getServerFacilityIds() ?? [];
      return facilityId;
    },
    // Intentionally public: telemetry is collected before sign-in, and carries no
    // action a permission could gate.
    onRequest: req => req.flagPermissionChecked(),
  }),
);
