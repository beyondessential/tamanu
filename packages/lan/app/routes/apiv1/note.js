import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError, InappropriateEndpointError } from 'shared/errors';

export const note = express.Router();

note.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, body, params } = req;

    const editedNote = await models.Note.findByPk(params.id);
    if (!editedNote) {
      throw new NotFoundError();
    }

    req.checkPermission('write', editedNote.objectType);

    const owner = await models[editedNote.objectType].findByPk(editedNote.objectId);
    req.checkPermission('write', owner);

    await editedNote.update(body);

    res.send(editedNote);
  }),
);

note.post(
  '/$',
  asyncHandler(async (req, res) => {
    throw new InappropriateEndpointError(
      'Note should be created using a nested endpoint (eg visit/12345/notes)',
    );
  }),
);
