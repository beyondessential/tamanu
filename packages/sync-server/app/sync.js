import express from 'express';
import asyncHandler from 'express-async-handler';
import asyncPool from 'tiny-async-pool';
import config from 'config';

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
import { removeSensitiveAnswers } from './utils/removeSensitiveAnswers';

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

    /*
       The problem here is that sequelize has a connection pool with (by default)
       5 slots. It's okay to launch more queries than that, because they just get
       queued up for a while until the pool is free. The issue with that is if
       you launch 5000 queries at once, and those queries are going to take a
       combined 3 seconds to run, you block the entire connection pool for the
       next 3 seconds. If you have multiple clients hitting different endpoints
       at the same time, this does weird things to your latency.
    */
    const channelChangeChecks = await asyncPool(
      config.sync.concurrentChannelChecks,
      channels.map(channel => [channel, body[channel]]),
      async ([channel, cursor]) => {
        const count = await store.countSince(channel, cursor, { limit: 1 });
        return count > 0;
      },
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
    const { since, until, limit = '100', noCount = 'false' } = query;

    if (!since) {
      throw new InvalidParameterError('Sync GET request must include a "since" parameter');
    }

    const count = noCount === 'true' ? null : await store.countSince(channel, since);

    const limitNum = parseInt(limit, 10) || undefined;
    const untilNum = parseInt(until, 10) || undefined;

    const plan = createExportPlan(store.sequelize, channel);
    const { records, cursor } = await executeExportPlan(plan, {
      since,
      until: untilNum,
      limit: limitNum,
    });

    // Check if request is from the lan server
    const clientType = req.header('X-Tamanu-Client');
    const isLanServer = clientType === 'Tamanu LAN Server';

    // Check if channel syncs down SurveyResponseAnswers (happens on two channels)
    const hasSurveyAnswers =
      channel === 'surveyResponseAnswer' || /^patient\/\S+\/encounter$/.test(channel);

    const shouldFilterAnswers = !isLanServer && hasSurveyAnswers;
    const filteredRecords = shouldFilterAnswers
      ? await removeSensitiveAnswers(channel, store.models, records)
      : records;

    const countMsg = noCount !== 'true' ? ` out of ${count}` : '';
    log.info(`GET from ${channel} : returned ${records?.length}${countMsg} records`);
    res.send({
      count,
      requestedAt,
      records: filteredRecords,
      cursor,
      serverTime: Date.now(),
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

    const plan = createImportPlan(store.sequelize, channel);
    const upsert = async records => {
      // TODO: sort out permissions
      // if (!shouldPush(model)) {
      //   throw new InvalidOperationError(`Pushing to channel "${channel}" is not allowed`);
      // }
      return executeImportPlan(plan, records);
    };

    const syncRecords = Array.isArray(body) ? body : [body];
    const count = await upsert(syncRecords);
    log.info(`POST to ${channel} : ${count} records`);
    res.send({ count, requestedAt });
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
