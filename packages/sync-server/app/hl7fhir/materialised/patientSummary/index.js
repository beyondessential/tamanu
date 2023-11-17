import { formatRFC7231 } from 'date-fns';
import asyncHandler from 'express-async-handler';

import { generateIPSBundle } from './bundleGenerator';

export function patientSummaryHandler() {
  return asyncHandler(async (req, res) => {
    const { id: patientId } = req.params;
    const { models } = req.store;

    const { patient, bundle } = await generateIPSBundle(patientId, req.user, models);

    res.header('Last-Modified', formatRFC7231(patient.updatedAt));
    res.send(bundle);
  });
}
