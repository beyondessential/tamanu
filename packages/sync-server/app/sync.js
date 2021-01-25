import express from 'express';
import asyncHandler from 'express-async-handler';
import { InvalidParameterError, NotFoundError } from 'shared/errors';

import { log } from './logging';
import { convertToDbRecord, convertFromDbRecord } from './convertDbRecord';

export const syncRoutes = express.Router();

syncRoutes.get(
  '/:channel',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = new Date().valueOf();

    const { store, query, params } = req;
    const { channel } = params;
    const { since, limit = '100', page = '0' } = query;

    if (!since) {
      throw new InvalidParameterError('Sync GET request must include a "since" parameter');
    }

    const count = await store.countSince(channel, since);

    const limitNum = parseInt(limit, 10) || undefined;
    const offsetNum = limitNum ? parseInt(page, 10) * limit : undefined;
    const dbRecords = await store.findSince(channel, since, {
      limit: limitNum,
      offset: offsetNum,
    });
    const records = dbRecords.map(record => convertFromDbRecord(record));

    log.info(`GET from ${channel} : ${count} records`);
    res.send({
      count,
      requestedAt,
      records,
    });
  }),
);

syncRoutes.post(
  '/:channel',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = new Date().valueOf();

    const { store, params, body } = req;
    const { channel } = params;

    const upsert = record => {
      const lastSynced = new Date().valueOf();
      const dbRecord = convertToDbRecord(record);
      return store.upsert(channel, { lastSynced, ...dbRecord });
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
  }),
);

syncRoutes.delete(
  '/:channel/:recordId',
  asyncHandler(async (req, res) => {
    // grab the requested time before running any queries
    const requestedAt = new Date().valueOf();

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
