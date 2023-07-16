import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { VISIBILITY_STATUSES } from 'shared/constants/importable';

import { checkNotePermission } from '../../utils/checkNotePermission';

export const noteChangelogsHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    const { id: recordId, noteId: rootNoteId } = params;

    await checkNotePermission(req, { recordType, recordId }, 'list');

    const notes = await models.Note.findAll({
      include: [
        {
          model: models.User,
          as: 'author',
        },
        {
          model: models.User,
          as: 'onBehalfOf',
        },
      ],
      where: {
        [Op.or]: [{ revisedById: rootNoteId }, { id: rootNoteId }],
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      order: [['date', 'DESC']],
    });

    res.send({ data: notes, count: notes.length });
  });
