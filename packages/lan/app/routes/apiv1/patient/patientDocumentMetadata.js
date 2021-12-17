import express from 'express';
import asyncHandler from 'express-async-handler';
import { uploadAttachment } from '../../../utils/uploadAttachment';
import { DOCUMENT_SIZE_LIMIT } from 'shared/constants';

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

    // TODO: Figure out permissions with Attachment and DocumentMetadata.
    // Presumably, they should be the same as they depend on each other.
    req.checkPermission('write', 'DocumentMetadata');

    // Create file on the sync server
    const { attachmentId, metadata } = await uploadAttachment(req, DOCUMENT_SIZE_LIMIT);

    const documentMetadataObject = await models.DocumentMetadata.create({
      ...metadata,
      attachmentId,
      patientId: params.id,
    });

    res.send(documentMetadataObject);
  }),
);
