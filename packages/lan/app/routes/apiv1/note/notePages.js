import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError, ForbiddenError } from 'shared/errors';
import { NOTE_RECORD_TYPES } from 'shared/constants';

import { noteItems } from './noteItems';
import { checkNotePermission } from '../../../utils/checkNotePermission';

const notePageRoute = express.Router();
export { notePageRoute as notePages };

// Encounter notes cannot be edited
function canModifyNote(notePage) {
  return notePage.recordType !== NOTE_RECORD_TYPES.ENCOUNTER;
}

notePageRoute.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body: noteData } = req;

    await checkNotePermission(req, noteData, 'create');

    const notePage = await models.NotePage.create({
      recordType: noteData.recordType,
      recordId: noteData.recordId,
      date: noteData.date,
      noteType: noteData.noteType,
    });

    const noteItem = await models.NoteItem.create({
      notePageId: notePage.id,
      authorId: noteData.authorId,
      onBehalfOfId: noteData.onBehalfOfId,
      date: noteData.date,
      content: noteData.content.trim(),
    });

    res.send({ notePage, noteItem });
  }),
);

notePageRoute.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const notePageId = params.id;
    const notePage = await models.NotePage.findOne({
      include: [
        {
          model: models.NoteItem,
          as: 'noteItems',
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
        },
      ],
      where: { id: notePageId },
    });

    await checkNotePermission(req, notePage, 'read');

    res.send(notePage);
  }),
);

notePageRoute.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;

    const editedNotePage = await models.NotePage.findOne({
      include: [
        {
          model: models.NoteItem,
          as: 'noteItems',
          include: [
            { model: models.User, as: 'author' },
            { model: models.User, as: 'onBehalfOf' },
          ],
        },
      ],
      where: { id: params.id },
    });

    if (!editedNotePage) {
      throw new NotFoundError();
    }

    if (canModifyNote(editedNotePage) === false) {
      throw new ForbiddenError('Cannot edit encounter notes.');
    }

    req.checkPermission('write', editedNotePage.recordType);

    const owner = await models[editedNotePage.recordType].findByPk(editedNotePage.recordId);

    req.checkPermission('write', owner);

    await editedNotePage.noteItems[0].update({ ...body });

    res.send(editedNotePage);
  }),
);

notePageRoute.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const notePageToDelete = await models.NotePage.findByPk(req.params.id);

    if (!notePageToDelete) {
      throw new NotFoundError();
    }

    if (canModifyNote(notePageToDelete) === false) {
      throw new ForbiddenError('Cannot delete encounter notes.');
    }

    req.checkPermission('write', notePageToDelete.recordType);

    await req.models.NoteItem.destroy({
      where: {
        notePageId: req.params.id,
      },
    });
    await req.models.NotePage.destroy({
      where: {
        id: req.params.id,
      },
    });

    res.send({});
  }),
);

notePageRoute.use(noteItems);
