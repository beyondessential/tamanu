import express from 'express';
import asyncHandler from 'express-async-handler';

import { log } from 'shared/services/logging';

import { CentralSyncManager } from './CentralSyncManager';

const syncManager = new CentralSyncManager();

export const syncRoutes = express.Router();

syncRoutes.get(
  '/beat/current',
  asyncHandler(async (req, res) => {
    const { store } = req;
    const currentBeat = await syncManager.getCurrentBeat(store.sequelize);
    res.send(currentBeat);
  }),
);

syncRoutes.get(
  '/beat/next',
  asyncHandler(async (req, res) => {
    const { store } = req;
    const nextBeat = await syncManager.getNextBeat(store.sequelize);
    res.send(nextBeat);
  }),
);

syncRoutes.post(
  '/pull',
  asyncHandler(async (req, res) => {
    const { body, store } = req;
    const { since } = body;
    console.log(body);
    if (!Number.isInteger(since)) {
      throw new Error('Must provide "since" when starting a sync session, even if it is 0');
    }
    const { sessionId, count } = await syncManager.startOutgoingSession(
      store.models,
      parseInt(since, 10),
    );
    res.send({ sessionId, count });
  }),
);

syncRoutes.post(
  '/push',
  asyncHandler(async (req, res) => {
    const { sessionId } = await syncManager.startIncomingSession();
    res.send({ sessionId });
  }),
);

syncRoutes.get(
  '/pull/:sessionId',
  asyncHandler(async (req, res) => {
    const { query, params } = req;
    const { sessionId } = params;
    const { offset = '0', limit = '100' } = query;
    const changes = await syncManager.getOutgoingChanges(sessionId, {
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
    });
    log.info(`GET /pull : returned ${changes.length} changes`);
    res.send(changes);
  }),
);

syncRoutes.post(
  '/push/:sessionId',
  asyncHandler(async (req, res) => {
    const { params, body: changes } = req;
    const { sessionId } = params;

    await syncManager.addIncomingChanges(sessionId, changes);
    log.info(`POST to ${sessionId} : ${changes.length} records`);
    res.send({});
  }),
);

// match pull and push with same handler, for ending sync session
const endSyncSession = asyncHandler(async (req, res) => {
  const { params, store } = req;
  const { sessionId } = params;
  try {
    await syncManager.endSession(store.sequelize, store.models, sessionId);
  } catch (e) {
    console.log(e);
  }
  res.send({});
});
syncRoutes.delete('/push/:sessionId', endSyncSession);
syncRoutes.delete('/pull/:sessionId', endSyncSession);
