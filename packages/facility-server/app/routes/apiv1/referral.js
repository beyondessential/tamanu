import express from 'express';
import asyncHandler from 'express-async-handler';

import { SURVEY_TYPES } from '@tamanu/constants';
import { InvalidParameterError } from '@tamanu/errors';
import { permissionCheckingRouter, simpleGet, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const referral = express.Router();

referral.get('/:id', simpleGet('Referral', { auditAccess: true }));
referral.put('/:id', simplePut('Referral', { allowedFields: ['status'] }));
referral.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      models,
      body: { facilityId, ...body },
      db,
      settings,
    } = req;
    req.checkPermission('create', 'Referral');

    // Creating a referral is authorised by the referral permission alone, so the response it
    // records has to be to a referral form, not a form under permissions or rules of its own.
    const survey = await models.Survey.findByPk(body.surveyId);
    if (survey?.surveyType !== SURVEY_TYPES.REFERRAL) {
      throw new InvalidParameterError('A referral must be a response to a referral form.');
    }

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
