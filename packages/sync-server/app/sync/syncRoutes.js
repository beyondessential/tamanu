import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidParameterError, NotFoundError } from 'shared/errors';

import { log } from 'shared/services/logging';

const syncManager = new CentralSyncManager();

export const syncRoutes = express.Router();

syncRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const { store, query, params } = req;
    const { patientId } = params;
    const { since, limit = '100', offset = '0' } = query;

    if (!since) {
      throw new InvalidParameterError('Sync GET request must include a "since" parameter');
    }

    const limitNum = parseInt(limit, 10) || undefined;

    log.info(`GET : returned ${records?.length} records`);
    res.send({
      changes: filteredChanges,
      cursor,
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
