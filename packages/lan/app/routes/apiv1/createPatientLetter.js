import express from 'express';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const createPatientLetter = express.Router();

// TODO: Create actual pdf
const createPDF = data => 'hi';

// For now - just assume id is a patient ID. This whole endpoint will need to be duplicated and moved.
createPatientLetter.post('/:id', asyncHandler(async (req, res) => {
  req.checkPermission('create', 'DocumentMetadata');
  const { models, params } = req;

  // Make sure the specified patient exists
  const patient = await models.Patient.findByPk(params.id);
  if (!patient) {
    throw new NotFoundError();
  }
  
  const pdf = await createPDF(req.body);
  // Create file on the sync server
  const DOCUMENT_SIZE_LIMIT = 10000000;
  const { attachmentId, metadata } = await uploadAttachment(pdf, DOCUMENT_SIZE_LIMIT);

  const documentMetadataObject = await models.DocumentMetadata.create({
    ...metadata,
    attachmentId,
    patientId: params.id,
  });

  res.send(documentMetadataObject);
}));
