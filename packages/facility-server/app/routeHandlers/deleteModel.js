import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/errors';

const deleteModel = (modelName, paramName, displayName = modelName) => {
  return asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('delete', modelName);

    const model = models[modelName];
    const primaryKey = params[paramName];
    const object = await model.findByPk(primaryKey);

    if (!object) {
      throw new NotFoundError(`Cannot find ${displayName.toLowerCase()} with id ${primaryKey}`);
    }

    req.checkPermission('delete', object);
    await object.destroy();
    res.send({ message: `${displayName} deleted successfully` });
  });
}

export const deleteEncounter = deleteModel('Encounter', 'id');
export const deleteReferral = deleteModel('Referral', 'referralId');
export const deleteSurveyResponse = deleteModel(
  'SurveyResponse',
  'surveyResponseId',
  'Survey response',
);
export const deleteDocumentMetadata = deleteModel(
  'DocumentMetadata',
  'documentMetadataId',
  'Document',
);
