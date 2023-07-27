import express from 'express';
import { ForbiddenError, NotFoundError } from 'shared/errors';
import { constructPermission } from 'shared/permissions/middleware';
import asyncHandler from 'express-async-handler';
import bodyParser from 'body-parser';
import { promises as fs } from 'fs';
import { createChunkedUploadEndpoint, createDataImporterEndpoint } from './importerEndpoint';
import { programImporter } from './programImporter';
import { referenceDataImporter } from './referenceDataImporter';
import { exporter, getExportedFileSize, getExportedFileName } from './exporter';
import { mergePatientHandler } from './patientMerge';
import { syncLastCompleted } from './sync';
import { assetRoutes } from './asset';
import { writeChunkData } from './exporter/writeChunkData';

export const adminRoutes = express.Router();

// Only construct permissions for the admin stack for now.
// The only reason this isn't applied earlier/more generally is
// because it might affect sync performance. This will be fine to
// remove once more general permission checks have been implemented.
adminRoutes.use(constructPermission);

adminRoutes.use(
  asyncHandler((req, res, next) => {
    if (!req.ability.can('write', 'ReferenceData') || !req.ability.can('write', 'User')) {
      throw new ForbiddenError(
        'You do not have permission to access the central server admin panel.',
      );
    }
    next();
  }),
);

adminRoutes.post('/mergePatient', mergePatientHandler);

// A temporary lookup-patient-by-displayId endpoint, just to
// support patient merge because the patient search functionality is only
// available on LAN and there was some time pressure to get it out the door.
// This should be replaced by the full-fledged patient search once some
// more consideration has been put into how that functionality should best
// be shared between the server modules.
adminRoutes.get(
  '/lookup/patient/:displayId',
  asyncHandler(async (req, res) => {
    // Note there is no permission check for this endpoint as it's mounted under the
    // admin routes
    const { Patient } = req.store.models;
    const { displayId } = req.params;
    const patient = await Patient.findOne({
      where: {
        displayId,
      },
      include: ['village'],
    });
    if (!patient) throw new NotFoundError(`Could not find patient with display ID ${displayId}.`);
    res.send(patient);
  }),
);

adminRoutes.post('/import/referenceData', createDataImporterEndpoint(referenceDataImporter));
adminRoutes.post(
  '/import/referenceData/process',
  createDataImporterEndpoint(referenceDataImporter, true),
);

adminRoutes.post('/import/program', createDataImporterEndpoint(programImporter));

adminRoutes.get(
  '/export/referenceData',
  asyncHandler(async (req, res) => {
    const { store, query } = req;
    const filename = await exporter(store.models, query.includedDataTypes);
    res.download(filename);
  }),
);

adminRoutes.post(
  '/export/referenceData/generate',
  asyncHandler(async (req, res) => {
    const { store, body } = req;
    const filename = getExportedFileName(req.user.id);
    await exporter(store.models, body.includedDataTypes, filename);
    const fileDetails = await getExportedFileSize(filename);
    res.send({
      message: 'File was created successfully',
      ...fileDetails,
    });
  }),
);

adminRoutes.get(
  '/export/download',
  asyncHandler(async (req, res) => {
    const start = parseInt(req.query.start); // Assuming the start parameter is passed as a query parameter
    const end = parseInt(req.query.end); // Assuming the end parameter is passed as a query parameter
    const filename = getExportedFileName(req.user.id);
    await writeChunkData(filename, start, end, res);
  }),
);

adminRoutes.post(
  '/export/completed',
  asyncHandler(async (req, res) => {
    const filename = getExportedFileName(req.user.id);
    await fs.unlink(filename);
    res.send({
      message: 'Export completed successfully',
    });
  }),
);

adminRoutes.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
adminRoutes.post('/upload/chunk', createChunkedUploadEndpoint());

adminRoutes.get('/sync/lastCompleted', syncLastCompleted);

adminRoutes.use('/asset', assetRoutes);
