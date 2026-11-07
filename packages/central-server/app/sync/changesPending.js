import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { InvalidParameterError } from '@tamanu/errors';

import { getHighestRealChangeTick } from './getHighestRealChangeTick';

// The pull cursor is an integer tick; leaving it out means the device has never pulled.
const querySchema = z.object({
  since: z
    .string()
    .regex(/^-?\d+$/, 'since must be an integer sync tick')
    .transform(Number)
    .optional(),
});

/**
 * The inputs the check reads from the request, besides the device that is calling:
 *
 * - `req.models`, which must hold `SyncLookup`
 * - `req.device`, the calling device, as loaded by the token check
 * - `req.changesPendingSource`, where the highest real-change tick and the lookup table setting
 *   come from
 *
 * They come from the request so the handler can run unchanged against another copy of the
 * database, as the supervisor's does while central sleeps (see ASLEEP#changes-pending-check).
 *
 * @typedef {object} ChangesPendingSource
 * @property {boolean} lookupTableEnabled central's `sync.lookupTable.enabled`
 * @property {() => Promise<number | null>} getHighestRealChangeTick
 */

/**
 * The source central's api uses: the lookup table in the database the request is served from.
 *
 * @param {object} models
 * @param {boolean} lookupTableEnabled
 * @returns {ChangesPendingSource}
 */
export const buildLookupChangesPendingSource = (models, lookupTableEnabled) => ({
  lookupTableEnabled,
  getHighestRealChangeTick: () => getHighestRealChangeTick(models),
});

// spec: SYNCHK#the-check
// Answers whether anything that syncs to devices has changed since the device's last pull.
export const changesPendingHandler = asyncHandler(async (req, res) => {
  const { device, changesPendingSource } = req;
  // a cursor we cannot read is the caller's mistake, so answer as one rather than erroring
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new InvalidParameterError(parsed.error.issues[0]?.message ?? 'Invalid query');
  }
  const { since } = parsed.data;

  await device.markSeenIfStale();

  // Without the lookup table there is no tick to compare against, so a session must decide.
  const hasNeverPulled = since === undefined;
  if (hasNeverPulled || !changesPendingSource.lookupTableEnabled) {
    res.json({ changesToPull: true });
    return;
  }

  const highestRealChangeTick = await changesPendingSource.getHighestRealChangeTick();
  res.json({ changesToPull: highestRealChangeTick !== null && highestRealChangeTick > since });
});
