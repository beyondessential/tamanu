import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidParameterError, NotFoundError } from 'shared/errors';

import { log } from '~/logging';

import { attachmentManagerMiddleware } from './attachmentManager';

export const attachmentRoutes = express.Router();

attachmentRoutes.use(attachmentManagerMiddleware);

function getFilename(disposition) {
  if(!disposition) return '';

  const match = disposition.match(/filename="([^"]*)"/);
  if(!match) return '';

  return match[1];
}

attachmentRoutes.put('/:id', asyncHandler(async (req, res) => {
  const { headers, params } = req;
  const { id } = params;

  const { 
    ['content-type']: contentType,
    ['content-disposition']: contentDisposition = '',
  } = headers;

  const filename = getFilename(contentDisposition) || `${id}.bin`;

  // write data
  const { 
    bytesWritten, 
    finalise
  } = await req.attachmentManager.saveData(id, req);

  // TODO check permission 
  
  const attachmentObject = req.store.models.Attachment.build({
    id,
    filename,
    contentType,
    size: bytesWritten,
  });

  await attachmentObject.save();
  
  // move the object to its final resting place
  finalise();

  res.send({ success: true });
}));

attachmentRoutes.get('/:id', asyncHandler(async (req, res) => {
  const { params } = req;
  const { id } = params;

  const data = await req.store.models.Attachment.findByPk(id);

  if(!data) {
    throw new ForbiddenError('You do not have permission to view this attachment.');
  }

  // TODO: check user has permission to view this file

  res.status(200);
  res.setHeader('Content-Type', data.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
  res.setHeader('Content-Length', data.size);

  // TODO: is this not setting the HTTP header properly somehow...?
  const stream = req.attachmentManager.createReadStream(data.id);
  stream.pipe(res);
}));

