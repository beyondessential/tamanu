import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError, ForbiddenError } from 'shared/errors';
import { NOTE_RECORD_TYPES } from 'shared/constants';

import { noteItems } from './noteItems';

const notePageRoute = express.Router();
export { notePageRoute as notePages };

// Encounter notes cannot be edited
function canModifyNote(noteObject) {
  return noteObject.recordType !== NOTE_RECORD_TYPES.ENCOUNTER;
}

notePageRoute.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Encounter');

    const { models, body: noteData } = req;

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

    editedNotePage.noteItems[0].update({ ...body });

    res.send(editedNotePage);
  }),
);

notePageRoute.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const notePageToBeDeleted = await models.NotePage.findOneWithSingleNoteItem(models, {
      where: { id: req.params.id },
    });
    if (!notePageToBeDeleted) {
      throw new NotFoundError();
    }

    if (canModifyNote(notePageToBeDeleted) === false) {
      throw new ForbiddenError('Cannot delete encounter notes.');
    }

    req.checkPermission('write', notePageToBeDeleted.recordType);

    await req.models.NotePage.destroy({
      where: {
        id: req.params.id,
      },
    });

    await req.models.NoteItem.destroy({
      where: {
        notePageId: req.params.id,
      },
    });
    res.send({});
  }),
);

notePageRoute.use(noteItems);
