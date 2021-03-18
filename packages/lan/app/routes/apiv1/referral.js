import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simpleGetList, permissionCheckingRouter } from './crudHelpers';

export const referral = express.Router();

referral.get('/:id', simpleGet('Referral'));
referral.put('/:id', simplePut('Referral'));
referral.post(
  '/$',
  asyncHandler(async (req, res) => {
    console.log({req: req.body});
    const { models } = req;
    req.checkPermission('create', 'Referral');
    const newReferral = await models.Referral.create(req.body);

    res.send(newReferral);
  }),
);

const referralRelations = permissionCheckingRouter('read', 'Referral');

referral.use(referralRelations);
