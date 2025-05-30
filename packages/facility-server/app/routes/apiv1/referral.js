import express from 'express';
import asyncHandler from 'express-async-handler';

import { permissionCheckingRouter, simpleGet, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const referral = express.Router();

referral.get('/:id', simpleGet('Referral', { auditAccess: true }));
referral.put('/:id', simplePut('Referral'));
referral.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models,
      body: { facilityId, ...body },
      db,
      settings,
    } = req;
    req.checkPermission('create', 'Referral');

    const getDefaultId = async (type) =>
      models.SurveyResponseAnswer.getDefaultId(type, settings[facilityId]);
    const updatedBody = {
      locationId: body.locationId || (await getDefaultId('location')),
      departmentId: body.departmentId || (await getDefaultId('department')),
      userId: req.user.id,
      facilityId,
      ...body,
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
