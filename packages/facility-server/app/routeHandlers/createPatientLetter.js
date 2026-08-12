import asyncHandler from 'express-async-handler';
import fs from 'fs';
import { NotFoundError } from '@tamanu/errors';
import { DOCUMENT_SOURCES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { makePatientLetter } from '../utils/makePatientLetter';

export const createPatientLetter = (modelName, idField) =>
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'DocumentMetadata');
    const { models, params } = req;
    const { patientLetterData, clinicianId, name, facilityId } = req.body;

    const documentCreatedAt = getCurrentDateTimeString();

    // Make sure the specified encounter/patient exists
    const specifiedObject = await models[modelName].findByPk(params.id);
    if (!specifiedObject) {
      throw new NotFoundError();
    }

    const clinician = await models.User.findByPk(clinicianId);
    if (!clinician) {
      throw new NotFoundError('Clinician not found');
    }

    // Create attachment
    const { filePath, mimeType } = await makePatientLetter(req, {
      id: specifiedObject.id,
      clinician,
      documentCreatedAt,
      title: patientLetterData.title,
      body: patientLetterData.body,
      patient: patientLetterData.patient,
      facilityId,
    });

    const { size } = fs.statSync(filePath);

    // spec: ATCH
    // The generated letter is admitted to this server's outbox and its
    // attachment record created together, so the letter exists without central
    // connectivity and the blob always has its referencing record.
    const { hash, size: storedSize } = await req.blobCache.putOutbox(
      fs.createReadStream(filePath),
      { sizeHint: size },
    );
    fs.unlink(filePath, () => null);

    let attachmentId;
    try {
      ({ id: attachmentId } = await models.Attachment.create({
        type: mimeType,
        hash,
        size: storedSize,
        [idField]: params.id,
        ...(modelName === 'Encounter' ? { patientId: specifiedObject.patientId } : {}),
      }));
    } catch (error) {
      await req.blobCache.demoteIfStranded(hash);
      throw error;
    }

    const documentMetadataObject = await models.DocumentMetadata.create({
      name,
      source: DOCUMENT_SOURCES.PATIENT_LETTER,
      type: mimeType,
      documentOwner: clinician.displayName,
      attachmentId,
      documentCreatedAt,
      documentUploadedAt: documentCreatedAt,
      [idField]: params.id,
    });

    res.send(documentMetadataObject);
  });
