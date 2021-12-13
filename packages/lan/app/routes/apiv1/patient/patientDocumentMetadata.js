import express from 'express';
import asyncHandler from 'express-async-handler';
import fs, { promises as asyncFs } from 'fs';

export const patientDocumentMetadataRoutes = express.Router();

patientDocumentMetadataRoutes.get(
  '/:id/documentMetadata',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'DocumentMetadata');
    const patientId = params.id;
    const documentMetadataItems = await models.DocumentMetadata.findAll({
      where: {
        patientId,
      },
    });

    res.send({
      data: documentMetadataItems,
      count: documentMetadataItems.length,
    });
  }),
);

patientDocumentMetadataRoutes.post(
  '/:id/documentMetadata',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('write', 'DocumentMetadata');
    const patientId = params.id;
    const { file: fileName, ...documentMetadata } = req.body;

    // This will only work if the lan server is running on the same machine as
    // the desktop app, which is possibly very unusual. A proper solution needs
    // to be addressed when working through this functionality
    const fileData = await asyncFs.readFile(fileName);
    const { size } = fs.statSync(fileName);
    const fileType = fileName.split('.').pop();

    const { id: documentId } = await models.Attachment.create({
      type: fileType,
      size,
      data: fileData,
    });

    const documentMetadataObject = await models.DocumentMetadata.create({
      ...documentMetadata,
      type: fileType,
      uploadedDate: new Date(),
      createdDate: new Date(),
      documentId,
      patientId,
    });

    res.send(documentMetadataObject);
  }),
);
