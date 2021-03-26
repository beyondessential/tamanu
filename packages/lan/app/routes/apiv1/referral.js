import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { REFERENCE_TYPES } from 'shared/constants';

import { simpleGet, simplePut, permissionCheckingRouter } from './crudHelpers';

export const referral = express.Router();

referral.get('/:id', simpleGet('Referral'));
referral.put('/:id', simplePut('Referral'));
referral.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, db } = req;

    req.checkPermission('create', 'Referral');

    const getRefDataId = async type => {
      const code = config.survey.defaultCodes[type];
      const record = await models.ReferenceData.findOne({ where: { type, code } });
      if (!record) {
        return null;
      }
      return record.id;
    };

    const updatedBody = {
      locationId: body.locationId || (await getRefDataId(REFERENCE_TYPES.LOCATION)),
      departmentId: body.departmentId || (await getRefDataId(REFERENCE_TYPES.DEPARTMENT)),
      examinerId: req.user.id,
      ...body,
    };
    
    await db.transaction(async () => {
      const surveyResponseRecord = await models.SurveyResponse.createWithAnswers(updatedBody);
      const referral = await models.Referral.create({
        initiatingEncounterId: surveyResponseRecord.encounterId,
        surveyResponseId: surveyResponseRecord.id,
        ...req.body,
      });
      
      res.send(referral);
    });
  }),
);

const referralRelations = permissionCheckingRouter('read', 'Referral');

referral.use(referralRelations);
