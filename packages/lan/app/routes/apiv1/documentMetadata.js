import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGetList } from './crudHelpers';

export const documentMetadata = express.Router();

documentMetadata.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'DocumentMetadata');
    simpleGetList('DocumentMetadata')(req, res);
  }),
);
