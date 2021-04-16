import express from 'express';
import asyncHandler from 'express-async-handler';
import { /* InvalidOperationError, */ InvalidParameterError, NotFoundError } from 'shared/errors';
import {
  // shouldPush,
  // shouldPull,
  createImportPlan,
  executeImportPlan,
  createExportPlan,
  executeExportPlan,
} from 'shared/models/sync';

import { log } from 'shared/services/logging';

export const syncRoutes = express.Router();

// check for pending changes across a batch of channels
syncRoutes.post(
  '/channels',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = Date.now();

    const { store, body } = req;
    const channels = Object.keys(body);

    if (!channels || channels.length === 0) {
      throw new InvalidParameterError(
        'Checking `/channels` endpoint must include at least one channel/since in the body',
      );
    }

    const channelChangeChecks = await Promise.all(
      channels.map(async channel => {
        const count = await store.countSince(channel, body[channel]);
        return count > 0;
      }),
    );

    const channelsWithChanges = channels.filter((c, i) => !!channelChangeChecks[i]);

    res.send({
      requestedAt,
      channelsWithChanges,
    });
  }),
);

syncRoutes.get(
  '/:channel',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = Date.now();

    const { store, query, params } = req;
    const { channel } = params;
    const { since, limit = '100' } = query;

    if (!since) {
      throw new InvalidParameterError('Sync GET request must include a "since" parameter');
    }

    const count = await store.countSince(channel, since);

    const limitNum = parseInt(limit, 10) || undefined;

    await store.withModel(channel, async model => {
      const plan = createExportPlan(model);
      const { records, cursor } = await executeExportPlan(plan, channel, {
        since,
        limit: limitNum,
      });

      log.info(`GET from ${channel} : ${count} records`);
      res.send({
        count,
        requestedAt,
        records,
        cursor,
      });
    });
  }),
);

syncRoutes.post(
  '/:channel',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = Date.now();

    const { store, params, body } = req;
    const { channel } = params;

    await store.withModel(channel, async model => {
      const plan = createImportPlan(model);
      const upsert = async records => {
        // TODO: sort out permissions
        // if (!shouldPush(model)) {
        //   throw new InvalidOperationError(`Pushing to channel "${channel}" is not allowed`);
        // }
        return executeImportPlan(plan, channel, records);
      };

      const syncRecords = Array.isArray(body) ? body : [body];
      const count = await upsert(syncRecords);
      log.info(`POST to ${channel} : ${count} records`);
      res.send({ count, requestedAt });
    });
  }),
);

syncRoutes.delete(
  '/:channel/:recordId',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = Date.now();

    const { store, params } = req;
    const { channel, recordId } = params;

    const count = await store.markRecordDeleted(channel, recordId);

    if (count === 0) {
      throw new NotFoundError();
    } else if (count !== 1) {
      // if we hit this, something is very wrong
      throw new Error(`Expected deleted record count to be 0 or 1, was actually: ${count}`);
    }

    log.info(`DELETE from channel ${channel} record ${recordId}`);
    res.send({ count, requestedAt });
  }),
);
