import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError, ForbiddenError } from 'shared/errors';
import { NOTE_TYPES, NOTE_RECORD_TYPES, VISIBILITY_STATUSES } from 'shared/constants';

import { checkNotePermission } from '../../../utils/checkNotePermission';

const noteRoute = express.Router();
export { noteRoute as notes };

// Encounter notes cannot be edited
function canModifyNote(note) {
  return note.recordType !== NOTE_RECORD_TYPES.ENCOUNTER;
}

noteRoute.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body: noteData } = req;

    await checkNotePermission(req, noteData, 'create');

    const note = await models.Note.create({
      recordType: noteData.recordType,
      recordId: noteData.recordId,
      date: noteData.date,
      noteType: noteData.noteType,
      authorId: noteData.authorId,
      onBehalfOfId: noteData.onBehalfOfId,
      revisedById: noteData.revisedById,
      content: noteData.content.trim(),
    });

    res.send(note);
  }),
);

noteRoute.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const noteId = params.id;
    const note = await models.Note.findOne({
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
      where: { id: noteId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });

    await checkNotePermission(req, note, 'read');

    res.send(note);
  }),
);

noteRoute.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;

    const editedNote = await models.Note.findOne({
      include: [
        { model: models.User, as: 'author' },
        { model: models.User, as: 'onBehalfOf' },
      ],
      where: { id: params.id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });

    if (!editedNote) {
      throw new NotFoundError();
    }

    if (canModifyNote(editedNote) === false) {
      throw new ForbiddenError('Cannot edit encounter notes.');
    }

    if (editedNote.noteType === NOTE_TYPES.TREATMENT_PLAN) {
      req.checkPermission('write', 'TreatmentPlan');
    }
    
    req.checkPermission('write', editedNote.recordType);

    const owner = await models[editedNote.recordType].findByPk(editedNote.recordId);

    req.checkPermission('write', owner);

    await editedNote.update({ ...body });

    res.send(editedNote);
  }),
);

noteRoute.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const noteToDelete = await models.Note.findOne({
      where: { id: req.params.id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
    });

    if (!noteToDelete) {
      throw new NotFoundError();
    }

    if (canModifyNote(noteToDelete) === false) {
      throw new ForbiddenError('Cannot delete encounter notes.');
    }

    req.checkPermission('write', noteToDelete.recordType);

    await noteToDelete.update({ visibilityStatus: VISIBILITY_STATUSES.HISTORICAL });

    res.send({});
  }),
);
