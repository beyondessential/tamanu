import express from 'express';
import asyncHandler from 'express-async-handler';
import { WebRemote } from '~/sync';

export const attachment = express.Router();

attachment.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Attachment');

    const { query, params } = req;
    const { base64 } = query;
    const { id } = params;
    const remote = new WebRemote();
    const response = await remote.fetch(`attachment/${id}?base64=${base64}`, {
      method: 'GET',
    });
    res.send(response);
  }),
);
