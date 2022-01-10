import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { DOCUMENT_SIZE_LIMIT } from 'shared/constants';
import { uploadAttachment } from '../../../utils/uploadAttachment';

export const patientDocumentMetadataRoutes = express.Router();

patientDocumentMetadataRoutes.get(
  '/:id/documentMetadata',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('list', 'DocumentMetadata');
    req.checkPermission('list', 'Encounter');
    const patientId = params.id;

    // Get all encounter IDs for this patient
    const patientEncounters = await models.Encounter.findAll({
      where: {
        patientId,
      },
      attributes: ['id'],
    });

    // Convert into an array of strings for querying
    const encounterIds = patientEncounters.map(obj => obj.id);

    // Get all document metadata associated with the patient or any encounter
    // that the patient may have had.
    const documentMetadataItems = await models.DocumentMetadata.findAndCountAll({
      where: {
        [Op.or]: [{ patientId }, { encounterId: { [Op.in]: encounterIds } }],
      },
    });

    res.send({
      data: documentMetadataItems.rows,
      count: documentMetadataItems.count,
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
