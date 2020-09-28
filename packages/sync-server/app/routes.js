import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidParameterError } from 'shared/errors';

export const routes = express.Router();

routes.get('/patient/:id', asyncHandler(async (req, res) => {
  const { models, db, query } = req;
  const { since, limit } = query;

  // grab the requested time before running any queries
  const requestedAt = new Date();

  const records = [];
  const total = 0;

  res.send({
    count: total,
    requestedAt,
    records,
  });
}));

routes.get('/reference', asyncHandler(async (req, res) => {
  const { models, db, query } = req;
  const { since, limit } = query;

  if(!since) {
    throw new InvalidParameterError('Sync GET request must include a "since" parameter');
  }

  // grab the requested time before running any queries
  const requestedAt = new Date();

  const records = [];
  const total = 0;

  res.send({
    count: total,
    requestedAt,
    records,
  });
}));

