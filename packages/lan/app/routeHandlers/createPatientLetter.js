import asyncHandler from 'express-async-handler';
import fs, { promises as asyncFs } from 'fs';
import { NotFoundError } from 'shared/errors';
import { makePatientLetter } from '../utils/makePatientLetter';

export const createPatientLetter = (modelName, idField) =>
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'DocumentMetadata');
    const { models, params } = req;
    const { patientLetterData, clinicianId, ...documentMetadata } = req.body;

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
    const { filePath } = await makePatientLetter({
      id: specifiedObject.id,
      clinician,
      ...patientLetterData,
    });

    const { size } = fs.statSync(filePath);
    const fileData = await asyncFs.readFile(filePath, { encoding: 'base64' });
    fs.unlink(filePath, () => null);

    const { id: attachmentId } = await models.Attachment.create(
      models.Attachment.sanitizeForFacilityServer({
        // TODO: Maybe don't hardcode this?
        type: 'application/pdf',
        size,
        data: fileData,
      }),
    );

    const documentMetadataObject = await models.DocumentMetadata.create({
      ...documentMetadata,
      documentOwner: clinician.displayName,
      attachmentId,
      [idField]: params.id,
    });

    res.send(documentMetadataObject);
  });
