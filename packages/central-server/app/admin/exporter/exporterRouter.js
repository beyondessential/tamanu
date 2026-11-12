import express from 'express';
import asyncHandler from 'express-async-handler';
import { getImportablePermissionNoun } from '@tamanu/constants';

import { exporter, validateFileSize } from './exporter';
import { exportProgram } from '../programExporter/exportProgram';

export const exporterRouter = express.Router();

exporterRouter.get(
  '/referenceData',
  asyncHandler(async (req, res) => {
    const { store, query } = req;
    const { includedDataTypes, ...otherOptions } = query;

    for (const dataType of Object.values(includedDataTypes)) {
      req.checkPermission('list', getImportablePermissionNoun(dataType));
    }

    const filename = await exporter(store, includedDataTypes, otherOptions);

    // This is a temporary fix for limiting the exported file size.
    // TODO: Remove this validation as soon as we implement the download in chunks.
    const maxFileSizeInMB = await req.settings.get('export.maxFileSizeInMB');
    await validateFileSize(filename, maxFileSizeInMB);
    res.download(filename);
  }),
);

exporterRouter.get(
  '/program/:programId',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Program');

    const { store } = req;
    const { programId } = req.params;

    const filename = await exportProgram(store, programId);
    res.download(filename);
  }),
);
