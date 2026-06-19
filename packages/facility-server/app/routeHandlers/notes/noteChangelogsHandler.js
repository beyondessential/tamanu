import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { VISIBILITY_STATUSES } from '@tamanu/constants';

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
      // `date` is a second-precision datetime string, so a note created and then
      // edited within the same second ties. Break the tie by `createdAt` (the revised
      // row is inserted at edit time, so it has the later value) to keep the newest
      // version first deterministically — otherwise the change log order flaps.
      order: [
        ['date', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.send({ data: notes, count: notes.length });
  });
