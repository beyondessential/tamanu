import express from 'express';
import asyncHandler from 'express-async-handler';
import { getFilteredListByPermission } from '@tamanu/shared/utils/getFilteredListByPermission';
import {
  permissionCheckingRouter,
  simpleGet,
  simplePost,
  simplePut,
} from '@tamanu/shared/utils/crudHelpers';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Op } from 'sequelize';

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
      order: [['name', 'ASC']],
      include: [
        {
          association: 'surveys',
          where: {
            surveyType: 'programs',
            visibilityStatus: { [Op.ne]: VISIBILITY_STATUSES.HISTORICAL },
          },
        },
      ],
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
        visibilityStatus: { [Op.ne]: VISIBILITY_STATUSES.HISTORICAL },
      },
      order: [['name', 'ASC']],
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
