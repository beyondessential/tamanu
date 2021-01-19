import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const referral = express.Router();

const postReferral = asyncHandler(async (req, res) => {
  const { models } = req;
  req.checkPermission('create', 'Referral');
  const mockEncounter = (await models.Encounter.findAll({ limit: 1 }))[0];
  const referral = {
    encounterId: mockEncounter.id, ...req.body
  }
  console.log(referral);
  const object = await models.Referral.create(referral);
  res.send(object);
});

referral.get('/:id', simpleGet('Referral'));
referral.put('/:id', simplePut('Referral'));
referral.post('/$', postReferral);

