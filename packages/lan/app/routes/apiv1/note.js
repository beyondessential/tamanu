import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError } from 'lan/app/errors';

export const note = express.Router();

note.put('/:id', asyncHandler(async (req, res) => {
  const { models, body, params } = req;
  
  const note = await models.Note.findByPk(params.id);
  if(!note) {
    throw new NotFoundError();
  }

  req.checkPermission('write', note.objectType);

  const owner = await models[note.objectType].findByPk(note.objectId);
  req.checkPermission('write', owner);

  await note.update(body);

  res.send(note);
}));

note.post('/$', asyncHandler(async (req, res) => {
  const { models, body } = req;
  const { objectType, objectId } = body;
  req.checkPermission('write', objectType);
  const owner = await models[objectType].findByPk(objectId);
  if(!owner) {
    throw new NotFoundError();
  }
  req.checkPermission('write', owner);
  const note = await models.Note.create(body);

  res.send(note);
}));
