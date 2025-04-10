import express from 'express';
import asyncHandler from 'express-async-handler';
import { upperFirst } from 'lodash';
import { REFERENCE_TYPE_VALUES } from '@tamanu/constants';

import { exporter } from './exporter';
import { exportProgram } from '../programExporter/exportProgram';

export const exporterRouter = express.Router();

exporterRouter.get(
  '/referenceData',
  asyncHandler(async (req, res) => {
    const { store, query } = req;
    const { includedDataTypes, ...otherOptions } = query;

    for (const dataType of Object.values(includedDataTypes)) {
      // When it is ReferenceData, check if user has permission to list ReferenceData
      if (REFERENCE_TYPE_VALUES.includes(dataType)) {
        req.checkPermission('list', 'ReferenceData');
        continue;
      }

      // Otherwise, if it is other types (eg: patient, lab_test_types,... ones that have their own models)
      // check the permission against the models
      const nonReferenceDataModelName = upperFirst(dataType);
      req.checkPermission('list', nonReferenceDataModelName);
    }

    const filename = await exporter(store, includedDataTypes, otherOptions);
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
