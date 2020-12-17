import express from 'express';
import asyncHandler from 'express-async-handler';
import { InvalidParameterError, NotFoundError } from 'shared/errors';

import { log } from './logging';

export const syncRoutes = express.Router();

syncRoutes.get('/:channel', asyncHandler(async (req, res) => {
  const { store, query, params } = req;
  const { channel } = params;
  const { since, limit = "100", page = "0" } = query;

  if(!since) {
    throw new InvalidParameterError('Sync GET request must include a "since" parameter');
  }

  // grab the requested time before running any queries
  const requestedAt = new Date();

  const count = await store.countSince(channel, since);

  const limitNum = parseInt(limit, 10) || undefined;
  const offsetNum = limitNum ? parseInt(page, 10) * limit : undefined;
  const records = await store.findSince(channel, since, {
    limit: limitNum,
    offset: offsetNum,
  });

  log.info(`GET from ${channel} : ${count} records`);
  res.send({
    count,
    requestedAt,
    records,
  });
}));

syncRoutes.post('/:channel', asyncHandler(async (req, res) => {
  const { store, params, body } = req;
  const { channel } = params;

  const insert = record => {
    const lastSynced = (new Date()).valueOf();
    if(record.recordType === 'user') {
      return store.insertUser(record.data);
    } else {
      return store.insert(channel, { lastSynced, ...record });
    }
  };

  if(Array.isArray(body)) {
    const inserts = await Promise.all(body.map(insert));
    const count = inserts.filter(x => x).length;
    log.info(`POST to ${channel} : ${count} records`);
    res.send({ count });
  } else {
    log.info(`POST to ${channel} : 1 record`);
    const count = await insert(body);
    res.send({ count });
  }
}));

syncRoutes.delete(
  '/:channel/:recordId',
  asyncHandler(async (req, res) => {
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
    res.send({ count });
  }),
);
