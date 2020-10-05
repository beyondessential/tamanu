import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidParameterError } from 'shared/errors';

export const routes = express.Router();

routes.get('/:channel', asyncHandler(async (req, res) => {
  const { store, query, params } = req;
  const { channel } = params;
  const { since, limit } = query;

  if(!since) {
    throw new InvalidParameterError('Sync GET request must include a "since" parameter');
  }

  // grab the requested time before running any queries
  const requestedAt = new Date();

  // TODO: pagination
  const records = await store.findSince(channel, since);
  const total = records.length;

  res.send({
    count: total,
    requestedAt,
    records,
  });
}));

routes.post('/:channel', asyncHandler(async (req, res) => {
  const { store, params, body } = req;
  const { channel } = params;

  if(Array.isArray(body)) {
    const inserts = await Promise.all(
      body.map(record => store.insert(channel, record))
    );
    res.send({
      count: inserts.filter(x => x).length
    });
  } else {
    const count = await store.insert(channel, body);
    res.send({
      count 
    });
  }
}));
