import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simpleGetList, permissionCheckingRouter } from './crudHelpers';

export const referral = express.Router();

referral.get('/:id', simpleGet('Referral'));
referral.put('/:id', simplePut('Referral'));
referral.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('create', 'Referral');
    const newReferral = await models.Referral.create(req.body);
    if (req.body.diagnoses && req.body.diagnoses.length) {
      await Promise.all(
        req.body.diagnoses.map(async diagnosisId => {
          return await models.ReferralDiagnosis.create({
            diagnosisId,
            referralId: newReferral.get('id'),
          });
        }),
      );
    }
    res.send(newReferral);
  }),
);

const referralRelations = permissionCheckingRouter('read', 'Referral');

referralRelations.get('/:id/diagnoses', simpleGetList('ReferralDiagnosis', 'referralId'));

referral.use(referralRelations);
