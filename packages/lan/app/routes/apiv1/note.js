import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'shared/errors';

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
    const { models, body } = req;
    const { objectType, objectId } = body;
    req.checkPermission('write', objectType);
    const owner = await models[objectType].findByPk(objectId);
    if (!owner) {
      throw new NotFoundError();
    }
    req.checkPermission('write', owner);
    const createdNote = await models.Note.create(body);

    res.send(createdNote);
  }),
);
