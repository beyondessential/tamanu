import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError, InappropriateEndpointError, ForbiddenError } from 'shared/errors';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';

export const note = express.Router();

// A user can only modify an encounter note if they author it
function canModifyNote(noteObject, user) {
  if (noteObject.recordType !== NOTE_RECORD_TYPES.ENCOUNTER) {
    return true;
  }
  return noteObject.authorId === user.id;
}

note.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;

    const editedNote = await models.Note.findByPk(params.id);
    if (!editedNote) {
      throw new NotFoundError();
    }

    if (canModifyNote(editedNote, req.user) === false) {
      throw new ForbiddenError('Cannot edit a note created by another user.');
    }

    req.checkPermission('write', editedNote.recordType);

    const owner = await models[editedNote.recordType].findByPk(editedNote.recordId);
    req.checkPermission('write', owner);

    await editedNote.update(body);

    res.send(editedNote);
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
    const noteToBeDeleted = await req.models.Note.findByPk(req.params.id);
    if (!noteToBeDeleted) {
      throw new NotFoundError();
    }

    if (canModifyNote(noteToBeDeleted, req.user) === false) {
      throw new ForbiddenError('Cannot delete a note created by another user.');
    }

    req.checkPermission('write', noteToBeDeleted.recordType);
    await req.models.Note.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.send({});
  }),
);
