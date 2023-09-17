import asyncHandler from 'express-async-handler';
import fs, { promises as asyncFs } from 'fs';
import config from 'config';
import { NotFoundError } from 'shared/errors';
import { DOCUMENT_SOURCES } from '@tamanu/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { makePatientLetter } from '../utils/makePatientLetter';

export const createPatientLetter = (modelName, idField) =>
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'DocumentMetadata');
    const { models, params } = req;
    const { patientLetterData, clinicianId, name } = req.body;

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
      facilityId: config.serverFacilityId,
    });

    const { size } = fs.statSync(filePath);
    const fileData = await asyncFs.readFile(filePath, { encoding: 'base64' });
    fs.unlink(filePath, () => null);

    const { id: attachmentId } = await models.Attachment.create(
      models.Attachment.sanitizeForDatabase({
        type: mimeType,
        size,
        data: fileData,
      }),
    );

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
