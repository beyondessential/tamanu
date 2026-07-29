import { formatRFC7231 } from 'date-fns';
import asyncHandler from 'express-async-handler';

import { generateIPSBundle } from './bundleGenerator';

export function patientSummaryHandler() {
  return asyncHandler(async (req, res) => {
    const { id: patientId } = req.params;
    const { models } = req.store;

    // On facility servers req.settings is a facilityId-keyed map; use its server-wide reader.
    const settings = req.settings.global ?? req.settings;
    const { patient, bundle } = await generateIPSBundle(patientId, req.user, models, settings);

    res.header('Last-Modified', formatRFC7231(patient.updatedAt));
    res.send(bundle);
  });
}
