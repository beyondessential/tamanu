import express from 'express';
import asyncHandler from 'express-async-handler';
import { getFilteredListByPermission } from '@tamanu/shared/utils/getFilteredListByPermission';
import {
  simpleGet,
  simplePut,
  simplePost,
  permissionCheckingRouter,
} from '@tamanu/shared/utils/crudHelpers';

export const program = express.Router();

program.get('/:id', simpleGet('Program'));
program.put('/:id', simplePut('Program'));
program.post('/$', simplePost('Program'));

program.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Program');
    const { models, ability } = req;
    const records = await models.Program.findAll({
      include: [{ association: 'surveys', where: { surveyType: 'programs' } }],
    });

    // Don't include programs that don't have any permitted survey to submit
    const canSubmit = survey => ability.can('submit', survey);
    const hasAnySurveys = programRecord => programRecord.surveys.some(canSubmit);
    const filteredRecords = records.filter(hasAnySurveys);
    const data = filteredRecords.map(x => x.forResponse());

    res.send({
      count: data.length,
      data,
    });
  }),
);

const programRelations = permissionCheckingRouter('read', 'Program');
programRelations.get(
  '/:id/surveys',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Survey');
    const { models, params, ability } = req;
    const records = await models.Survey.findAll({
      where: {
        programId: params.id,
      },
    });
    const filteredRecords = getFilteredListByPermission(ability, records, 'submit');
    const data = filteredRecords.map(x => x.forResponse());

    res.send({
      count: data.length,
      data,
    });
  }),
);
program.use(programRelations);
