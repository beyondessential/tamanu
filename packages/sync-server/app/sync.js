import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from './logging';

import { InvalidParameterError } from 'shared/errors';

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


  if(Array.isArray(body)) {
    const inserts = await Promise.all(
      body.map(record => store.insert(channel, {
        lastSynced: (new Date()).valueOf(),
        ...record
      }))
    );
    const count = inserts.filter(x => x).length;
    log.info(`POST to ${channel} : ${count} records`);
    res.send({
      count,
    });
  } else {
    log.info(`POST to ${channel} : 1 record`);
    const count = await store.insert(channel, {
      lastSynced: (new Date()).valueOf(),
      ...body
    });

    res.send({
      count
    });
  }
}));

syncRoutes.delete(
  '/:channel/:id',
  asyncHandler(async (req, res) => {

  }),
);
