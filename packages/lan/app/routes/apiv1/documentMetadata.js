import express from 'express';
import asyncHandler from 'express-async-handler';

import { paginatedGetList } from './crudHelpers';

export const documentMetadata = express.Router();

documentMetadata.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'DocumentMetadata');
    paginatedGetList('DocumentMetadata')(req, res);
  }),
);
