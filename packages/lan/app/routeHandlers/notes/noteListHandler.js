import asyncHandler from 'express-async-handler';
import { VISIBILITY_STATUSES } from 'shared/constants/importable';

import { checkNotePermission } from '../../utils/checkNotePermission';

export const noteListHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { order = 'ASC', orderBy, noteType } = query;

    const recordId = params.id;
    await checkNotePermission(req, { recordType, recordId }, 'list');

    const where = {
      recordType,
      recordId,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    };

    if (noteType) {
      where.noteType = noteType;
    }

    const rows = await models.Note.findAll({
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
      where,
      order: orderBy ? [[orderBy, order.toUpperCase()]] : undefined,
    });

    res.send({ data: rows, count: rows.length });
  });

export const notesWithSingleItemListHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    const recordId = params.id;
    await checkNotePermission(req, { recordType, recordId }, 'list');

    const notes = await models.Note.findAll({
      include: [
        { model: models.User, as: 'author' },
        { model: models.User, as: 'onBehalfOf' },
      ],
      where: {
        recordId,
        recordType,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      order: [['date', 'DESC']],
    });

    res.send({ data: notes, count: notes.length });
  });
