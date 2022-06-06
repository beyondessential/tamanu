import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simplePost, permissionCheckingRouter } from './crudHelpers';
import { getFilteredListByPermission } from '../../utils/getFilteredListByPermission';

export const program = express.Router();

program.get('/:id', simpleGet('Program'));
program.put('/:id', simplePut('Program'));
program.post('/$', simplePost('Program'));

program.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Program');
    const { models, ability } = req;
    const records = await models.Program.findAll();
    const filteredRecords = getFilteredListByPermission(ability, records, 'submit');
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
