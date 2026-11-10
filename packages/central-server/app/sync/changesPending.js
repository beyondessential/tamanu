import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { InvalidParameterError } from '@tamanu/errors';

import { CentralSyncManager } from './CentralSyncManager';
import { getHighestRealChangeTick } from './getHighestRealChangeTick';

// The pull cursor is an integer tick; leaving it out means the device has never pulled.
const sinceSchema = z
  .string()
  .regex(/^-?\d+$/, 'since must be an integer sync tick')
  .transform(Number)
  .optional();

// spec: SYNCHK#the-check
export const changesPendingHandler = asyncHandler(async (req, res) => {
  // answer with the schema's one message, which the device records, rather than zod's issue list
  const parsed = sinceSchema.safeParse(req.query.since);
  if (!parsed.success) {
    throw new InvalidParameterError(parsed.error.issues[0]?.message ?? 'Invalid query');
  }
  const since = parsed.data;

  // Without the lookup table there is no tick to compare against, so a session must decide.
  // Read per request, so a config override applies.
  const hasNeverPulled = since === undefined;
  if (hasNeverPulled || !CentralSyncManager.config.sync.lookupTable.enabled) {
    res.json({ changesToPull: true });
    return;
  }

  const highestRealChangeTick = await getHighestRealChangeTick(req.models);
  res.json({ changesToPull: highestRealChangeTick !== null && highestRealChangeTick > since });
});
