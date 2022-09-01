import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError, InappropriateEndpointError, ForbiddenError } from 'shared/errors';
import { NOTE_RECORD_TYPES } from 'shared/constants';

export const note = express.Router();

// Encounter notes cannot be edited
function canModifyNote(noteObject) {
  return noteObject.recordType !== NOTE_RECORD_TYPES.ENCOUNTER;
}

note.put(
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

    await editedNotePage.noteItems[0].update(body);

    const response = await editedNotePage.getCombinedNoteObject(models);
    res.send(response);
  }),
);

note.post(
  '/$',
  asyncHandler(async () => {
    throw new InappropriateEndpointError(
      'Note should be created using a nested endpoint (eg encounter/12345/notes)',
    );
  }),
);

note.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models } = req;

    const noteToBeDeleted = await models.NotePage.findOne({
      where: { id: req.params.id },
    });

    if (!noteToBeDeleted) {
      throw new NotFoundError();
    }

    if (canModifyNote(noteToBeDeleted) === false) {
      throw new ForbiddenError('Cannot delete encounter notes.');
    }

    req.checkPermission('write', noteToBeDeleted.recordType);
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
