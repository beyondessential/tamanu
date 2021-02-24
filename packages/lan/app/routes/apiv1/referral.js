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

    // multiple diagnoses can be set as diagnosisId0, diagnosisCertainty0,
    // diagnosisId1, diagnosisCertainty1
    const diagnosisIdRegex = /^diagnosisId(?<diagnosisIndex>[\d]*)$/;
    const diagnosisCertaintyRegex = /^diagnosisCertainty(?<diagnosisIndex>[\d]*)$/;

    // group diagnoses and their corresponding certainty together
    const diagnosesMap = Object.entries(req.body).reduce((acc, field) => {
      if (!field[1]) {
        // if field value is empty, we can skip
        return acc;
      }
      const idResult = diagnosisIdRegex.exec(field[0]);
      if (idResult) {
        if (!acc[idResult.groups.diagnosisIndex]) {
          acc[idResult.groups.diagnosisIndex] = {};
        }
        acc[idResult.groups.diagnosisIndex].diagnosisId = field[1];
      }

      const certaintyResult = diagnosisCertaintyRegex.exec(field[0]);
      if (certaintyResult) {
        if (!acc[certaintyResult.groups.diagnosisIndex]) {
          acc[certaintyResult.groups.diagnosisIndex] = {};
        }
        acc[certaintyResult.groups.diagnosisIndex].certainty = field[1];
      }
      return acc;
    }, {});

    // loop through each diagnosis
    const diagnoses = Object.values(diagnosesMap);
    if (diagnoses.length) {
      await Promise.all(
        diagnoses.map(async diagnosis =>
          models.ReferralDiagnosis.create({
            diagnosisId: diagnosis.diagnosisId,
            certainty: diagnosis.certainty,
            referralId: newReferral.get('id'),
          }),
        ),
      );
    }
    res.send(newReferral);
  }),
);

const referralRelations = permissionCheckingRouter('read', 'Referral');

referralRelations.get('/:id/diagnoses', simpleGetList('ReferralDiagnosis', 'referralId'));

referral.use(referralRelations);
