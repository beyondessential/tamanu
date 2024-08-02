import express from 'express';
import asyncHandler from 'express-async-handler';

import { permissionCheckingRouter, simpleGet, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const referral = express.Router();

referral.get('/:id', simpleGet('Referral'));
referral.put('/:id', simplePut('Referral'));
referral.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, db } = req;
    const { facilityId, ...referralData } = body;
    req.checkPermission('create', 'Referral');

    const getDefaultId = async type => models.SurveyResponseAnswer.getDefaultId(type, facilityId);
    const updatedBody = {
      locationId: referralData.locationId || (await getDefaultId('location')),
      departmentId: referralData.departmentId || (await getDefaultId('department')),
      userId: req.user.id,
      ...referralData,
    };

    const referralRecord = await db.transaction(async () => {
      const surveyResponseRecord = await models.SurveyResponse.createWithAnswers(updatedBody);
      return models.Referral.create({
        initiatingEncounterId: surveyResponseRecord.encounterId,
        surveyResponseId: surveyResponseRecord.id,
        ...req.body,
      });
    });
    res.send(referralRecord);
  }),
);

const referralRelations = permissionCheckingRouter('read', 'Referral');

referral.use(referralRelations);
