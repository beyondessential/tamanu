import express from 'express';
import asyncHandler from 'express-async-handler';

export const routes = express.Router();

routes.get('/$', (req, res) => {
  res.send({
    ok: true
  });
});

routes.get('/patient/:id', asyncHandler(async (req, res) => {
  const { models, db, query } = req;
  const { since } = query;

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
  const { since } = query;

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

