import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { InvalidParameterError } from '@tamanu/errors';

import { CentralSyncManager } from './CentralSyncManager';
import { getHighestRealChangeTick } from './getHighestRealChangeTick';

// The pull cursor is an integer tick; leaving it out means the device has never pulled.
const querySchema = z.object({
  since: z
    .string()
    .regex(/^-?\d+$/, 'since must be an integer sync tick')
    .transform(Number)
    .optional(),
});

// spec: SYNCHK#the-check
// Answers whether anything that syncs to devices has changed since the device's last pull.
export const changesPendingHandler = asyncHandler(async (req, res) => {
  // a cursor we cannot read is the caller's mistake, so answer as one rather than erroring
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new InvalidParameterError(parsed.error.issues[0]?.message ?? 'Invalid query');
  }
  const { since } = parsed.data;

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
