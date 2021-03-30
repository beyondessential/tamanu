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

syncRoutes.get(
  '/:channel',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = Date.now();

    const { store, query, params } = req;
    const { channel } = params;
    const { since, limit = '100', page = '0', offset = '0' } = query;

    if (!since) {
      throw new InvalidParameterError('Sync GET request must include a "since" parameter');
    }

    const count = await store.countSince(channel, since);

    const limitNum = parseInt(limit, 10) || undefined;
    const pageBasedOffsetNum = limitNum ? parseInt(page, 10) * limit : undefined;
    const offsetNum = parseInt(offset, 10) || pageBasedOffsetNum;

    await store.withModel(channel, async model => {
      const plan = createExportPlan(model);
      const records = await executeExportPlan(plan, channel, {
        limit: limitNum,
        offset: offsetNum,
        since,
      });

      log.info(`GET from ${channel} : ${count} records`);
      res.send({
        count,
        requestedAt,
        records,
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
      const upsert = async record => {
        // TODO: sort out permissions
        // if (!shouldPush(model)) {
        //   throw new InvalidOperationError(`Pushing to channel "${channel}" is not allowed`);
        // }
        await executeImportPlan(plan, channel, record);
        return 1;
      };

      if (Array.isArray(body)) {
        const upserts = await Promise.all(body.map(upsert));
        const count = upserts.filter(x => x).length;
        log.info(`POST to ${channel} : ${count} records`);
        res.send({ count });
      } else {
        log.info(`POST to ${channel} : 1 record`);
        const count = await upsert(body);
        res.send({ count, requestedAt });
      }
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
